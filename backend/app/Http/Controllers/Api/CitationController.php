<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LiteratureEntry;
use App\Support\CitationFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CitationController extends Controller
{
    private const STYLES = ['apa7', 'ieee', 'harvard', 'chicago_author_date'];

    public function citation(Request $request, int $researchId, LiteratureEntry $entry): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);
        abort_unless($entry->research_id === $research->id, 404);

        $style = $this->style($request->query('style'), $research->citation_style);
        $data = $this->toArray($entry);
        $number = $style === 'ieee' ? $this->ieeeNumber($research->id, $entry->id) : null;

        return response()->json(['data' => [
            'style' => $style,
            'number' => $number,
            // Nomor di atas cuma perkiraan kalau sumbernya belum "Termasuk":
            // belum ada di daftar pustaka, jadi UI perlu bilang begitu.
            'included' => $entry->status === 'included',
            'in_text' => CitationFormatter::inText($data, $style, $number),
            'reference' => CitationFormatter::reference($data, $style),
        ]]);
    }

    public function bibliography(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);
        $style = $this->style($request->query('style'), $research->citation_style);

        $entries = $research->literatureEntries()
            ->where('status', 'included')
            ->get()
            ->map(fn (LiteratureEntry $entry) => [
                'id' => $entry->id,
                'sort' => ($entry->authors[0]['family'] ?? 'zzz').($entry->year ?? 0),
                'reference' => CitationFormatter::reference($this->toArray($entry), $style),
            ]);

        // IEEE: urut sesuai urutan sumber dimasukkan, lalu diberi nomor 1..n
        // yang sama persis dengan yang dipakai `citation()`.
        $entries = $style === 'ieee'
            ? $entries->sortBy('id')->values()
                ->map(fn (array $item, int $index) => [...$item, 'number' => $index + 1])
            : $entries->sortBy('sort')->values()->map(fn (array $item) => [...$item, 'number' => null]);

        return response()->json(['data' => [
            'style' => $style,
            'count' => $entries->count(),
            // `reference` sudah di-escape server; penanda *...* untuk italic.
            'items' => $entries->map(fn (array $item) => [
                'id' => $item['id'],
                'number' => $item['number'],
                'reference' => $item['reference'],
            ])->all(),
            'text' => $entries->map(fn (array $item) => (
                $item['number'] !== null ? "[{$item['number']}] " : ''
            ).preg_replace('/\*(.+?)\*/', '$1', $item['reference']))->implode("\n"),
        ]]);
    }

    /**
     * Nomor sitasi IEEE = posisi sumber di daftar pustaka (hanya yang "Termasuk"),
     * dihitung dari urutan id. Sumber yang belum masuk tetap dapat nomor prediktif
     * supaya dialog sitasi nggak menampilkan [1] palsu.
     */
    private function ieeeNumber(int $researchId, int $entryId): int
    {
        $ids = LiteratureEntry::where('research_id', $researchId)
            ->where('status', 'included')
            ->orderBy('id')
            ->pluck('id');

        $position = $ids->search($entryId);

        if ($position !== false) {
            return $position + 1;
        }

        return $ids->filter(fn (int $id) => $id < $entryId)->count() + 1;
    }

    public function bibtex(Request $request, int $researchId)
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $entries = $research->literatureEntries()->where('status', 'included')->get();

        $blocks = $entries->map(function (LiteratureEntry $entry) {
            $key = $this->bibtexKey($entry);
            $type = $entry->type === 'book' ? 'book' : ($entry->type === 'thesis' ? 'phdthesis' : 'article');
            $authors = collect($entry->authors ?? [])
                ->map(fn (array $author) => trim(($author['family'] ?? '').', '.($author['given'] ?? ''), ', '))
                ->implode(' and ');

            $fields = array_filter([
                'title' => $entry->title,
                'author' => $authors,
                'year' => $entry->year,
                'journal' => $entry->container,
                'volume' => $entry->volume,
                'number' => $entry->issue,
                'pages' => $entry->pages ? str_replace('–', '--', $entry->pages) : null,
                'doi' => $entry->doi,
                'url' => $entry->url,
            ], fn ($value) => $value !== null && $value !== '');

            $body = collect($fields)->map(fn ($value, $name) => "  {$name} = {{$value}},")->implode("\n");

            return "@{$type}{{$key},\n{$body}\n}";
        });

        return response($blocks->implode("\n\n"), 200, [
            'Content-Type' => 'application/x-bibtex; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="daftar-pustaka.bib"',
        ]);
    }

    private function style(?string $requested, ?string $default): string
    {
        $style = $requested ?: $default ?: 'apa7';

        return in_array($style, self::STYLES, true) ? $style : 'apa7';
    }

    private function toArray(LiteratureEntry $entry): array
    {
        return [
            'title' => $entry->title,
            'authors' => $entry->authors ?? [],
            'year' => $entry->year,
            'container' => $entry->container,
            'volume' => $entry->volume,
            'issue' => $entry->issue,
            'pages' => $entry->pages,
            'doi' => $entry->doi,
            'url' => $entry->url,
        ];
    }

    private function bibtexKey(LiteratureEntry $entry): string
    {
        $family = $entry->authors[0]['family'] ?? 'anon';

        return preg_replace('/[^A-Za-z0-9]/', '', $family.$entry->year.$entry->id) ?: 'entry'.$entry->id;
    }
}
