<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Mengambil metadata publik dari OpenAlex (utama) dan Crossref (fallback).
 * Tanpa API key, tanpa penyimpanan kredensial pihak ketiga.
 */
class LiteratureMetadata
{
    private const OPENALEX = 'https://api.openalex.org/works/doi:';

    private const CROSSREF = 'https://api.crossref.org/works/';

    /**
     * @return array{title:string,authors:array,year:?int,container:?string,volume:?string,issue:?string,pages:?string,doi:string,url:?string,abstract:?string,type:string,metadata_source:string}|null
     */
    public function fetchByDoi(string $doi): ?array
    {
        $doi = self::normalizeDoi($doi);

        if ($doi === '') {
            return null;
        }

        return $this->fromOpenAlex($doi) ?? $this->fromCrossref($doi);
    }

    public static function normalizeDoi(string $doi): string
    {
        $doi = trim($doi);
        $doi = preg_replace('#^(https?://(dx\.)?doi\.org/|doi:\s*)#i', '', $doi) ?? $doi;

        return strtolower(trim($doi));
    }

    /**
     * OpenAlex menyimpan abstrak sebagai inverted index: kata => [posisi].
     */
    public static function reconstructAbstract(?array $index): ?string
    {
        if (empty($index)) {
            return null;
        }

        $positioned = [];

        foreach ($index as $word => $positions) {
            foreach ((array) $positions as $position) {
                $positioned[(int) $position] = (string) $word;
            }
        }

        if (empty($positioned)) {
            return null;
        }

        ksort($positioned);

        return implode(' ', $positioned);
    }

    private function fromOpenAlex(string $doi): ?array
    {
        try {
            $response = Http::timeout(8)
                ->acceptJson()
                ->get(self::OPENALEX.rawurlencode($doi), array_filter([
                    'mailto' => config('services.openalex.mailto'),
                ]));
        } catch (ConnectionException) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $work = $response->json();

        if (empty($work['title'])) {
            return null;
        }

        return [
            'title' => mb_substr($work['title'], 0, 500),
            'authors' => self::splitDisplayNames($work['authorships'] ?? []),
            'year' => $work['publication_year'] ?? null,
            'container' => $work['primary_location']['source']['display_name'] ?? null,
            'volume' => $work['biblio']['volume'] ?? null,
            'issue' => $work['biblio']['issue'] ?? null,
            'pages' => self::openAlexPages($work['biblio'] ?? []),
            'doi' => self::normalizeDoi($work['doi'] ?? $doi),
            'url' => $work['primary_location']['landing_page_url'] ?? $work['doi'] ?? null,
            'abstract' => self::reconstructAbstract($work['abstract_inverted_index'] ?? null),
            'type' => self::mapType($work['type'] ?? null),
            'metadata_source' => 'openalex',
        ];
    }

    private function fromCrossref(string $doi): ?array
    {
        try {
            $response = Http::timeout(8)
                ->acceptJson()
                ->withUserAgent('Trackripsi/1.0 (mailto:'.(config('services.openalex.mailto') ?: 'noreply@example.com').')')
                ->get(self::CROSSREF.rawurlencode($doi));
        } catch (ConnectionException) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $message = $response->json('message');

        if (empty($message['title'][0])) {
            return null;
        }

        return [
            'title' => mb_substr($message['title'][0], 0, 500),
            'authors' => collect($message['author'] ?? [])
                ->map(fn (array $author) => [
                    'family' => $author['family'] ?? ($author['name'] ?? ''),
                    'given' => $author['given'] ?? '',
                ])
                ->filter(fn (array $author) => $author['family'] !== '')
                ->values()
                ->all(),
            'year' => $message['issued']['date-parts'][0][0] ?? null,
            'container' => $message['container-title'][0] ?? null,
            'volume' => isset($message['volume']) ? (string) $message['volume'] : null,
            'issue' => isset($message['issue']) ? (string) $message['issue'] : null,
            'pages' => $message['page'] ?? null,
            'doi' => self::normalizeDoi($message['DOI'] ?? $doi),
            'url' => $message['URL'] ?? 'https://doi.org/'.$doi,
            'abstract' => isset($message['abstract']) ? trim(strip_tags($message['abstract'])) : null,
            'type' => self::mapType($message['type'] ?? null),
            'metadata_source' => 'crossref',
        ];
    }

    /**
     * OpenAlex hanya memberi display_name ("Eko Arik Susmiatin");
     * pisahkan kata terakhir sebagai family agar formatter sitasi konsisten.
     */
    private static function splitDisplayNames(array $authorships): array
    {
        return collect($authorships)
            ->map(function (array $authorship) {
                $name = trim($authorship['author']['display_name'] ?? '');

                if ($name === '') {
                    return null;
                }

                $parts = preg_split('/\s+/', $name) ?: [$name];
                $family = array_pop($parts);

                return ['family' => $family, 'given' => implode(' ', $parts)];
            })
            ->filter()
            ->values()
            ->all();
    }

    private static function openAlexPages(array $biblio): ?string
    {
        $first = $biblio['first_page'] ?? null;
        $last = $biblio['last_page'] ?? null;

        if (! $first) {
            return null;
        }

        return $last ? $first.'–'.$last : (string) $first;
    }

    private static function mapType(?string $type): string
    {
        return match ($type) {
            'article', 'journal-article', 'posted-content', 'preprint' => 'journal',
            'book', 'book-chapter', 'monograph', 'edited-book' => 'book',
            'dissertation' => 'thesis',
            'dataset', 'report', 'peer-review' => 'other',
            default => 'web',
        };
    }
}
