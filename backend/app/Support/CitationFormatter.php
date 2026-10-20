<?php

namespace App\Support;

/**
 * Formatter sitasi. Pure function tanpa dependency eksternal.
 *
 * ponytail: IEEE diurutkan alfabetis (bukan urutan sitasi) karena nomor sitasi
 * butuh state seluruh naskah; pindah ke urutan sitasi bila user minta nomor manual.
 */
class CitationFormatter
{
    private const LIST_SEP = ', ';

    private const AND_SEP = ' and ';

    /**
     * Entry datang dari sumber pihak ketiga: semua teks di-escape sebelum dirangkai.
     */
    private static function sanitize(array $entry): array
    {
        foreach (['title', 'container', 'volume', 'issue', 'pages', 'doi', 'url'] as $key) {
            if (! empty($entry[$key])) {
                $entry[$key] = htmlspecialchars((string) $entry[$key], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            }
        }

        $entry['authors'] = array_map(
            fn (array $author) => [
                'family' => htmlspecialchars((string) ($author['family'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
                'given' => htmlspecialchars((string) ($author['given'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
            ],
            $entry['authors'] ?? []
        );

        return $entry;
    }

    public static function inText(array $entry, string $style): string
    {
        return self::inTextRaw(self::sanitize($entry), $style);
    }

    private static function inTextRaw(array $entry, string $style): string
    {
        $authors = $entry['authors'] ?? [];
        $year = $entry['year'] ?? 'n.d.';
        $first = $authors[0]['family'] ?? 'Anonim';
        $count = count($authors);

        return match ($style) {
            'ieee' => '[1]',
            'chicago_author_date' => match (true) {
                $count === 1 => "{$first} {$year}",
                $count <= 3 => self::joinFamilies($authors, self::LIST_SEP, self::AND_SEP)." {$year}",
                default => "{$first} et al. {$year}",
            },
            default => match (true) { // apa7 & harvard
                $count === 0 => "(Anonim, {$year})",
                $count === 1 => "({$first}, {$year})",
                $count === 2 => "({$first} & ".($authors[1]['family'] ?? '').", {$year})",
                default => "({$first} et al., {$year})",
            },
        };
    }

    public static function reference(array $entry, string $style): string
    {
        return self::referenceRaw(self::sanitize($entry), $style);
    }

    private static function referenceRaw(array $entry, string $style): string
    {
        return match ($style) {
            'ieee' => self::ieee($entry),
            'harvard' => self::harvard($entry),
            'chicago_author_date' => self::chicago($entry),
            default => self::apa7($entry),
        };
    }

    private static function apa7(array $entry): string
    {
        $year = $entry['year'] ?? 'n.d.';
        $authors = self::apaAuthors($entry['authors'] ?? []);
        $title = trim($entry['title'] ?? 'Tanpa judul');
        $container = $entry['container'] ?? null;
        $parts = [];

        if ($container) {
            $volume = ! empty($entry['volume']) ? ", {$entry['volume']}" : '';
            $issue = ! empty($entry['issue']) ? "({$entry['issue']})" : '';
            $pages = ! empty($entry['pages']) ? ", {$entry['pages']}" : '';
            $parts[] = "*{$container}*{$volume}{$issue}{$pages}";
        }

        if (! empty($entry['doi'])) {
            $parts[] = 'https://doi.org/'.$entry['doi'];
        } elseif (! empty($entry['url'])) {
            $parts[] = $entry['url'];
        }

        // APA 7: Judul. *Jurnal*, vol(issue), hal. https://doi
        $tail = $parts ? ' '.implode('. ', $parts).'.' : '.';

        return "{$authors} ({$year}). {$title}.{$tail}";
    }

    private static function harvard(array $entry): string
    {
        $year = $entry['year'] ?? 'n.d.';
        $authors = self::apaAuthors($entry['authors'] ?? []);
        $title = $entry['title'] ?? 'Tanpa judul';
        $container = $entry['container'] ?? null;

        $body = $container
            ? "{$title}, *{$container}*"
                .(! empty($entry['volume']) ? ", {$entry['volume']}" : '')
                .(! empty($entry['issue']) ? "({$entry['issue']})" : '')
                .(! empty($entry['pages']) ? ", hlm. {$entry['pages']}" : '')
            : $title;

        $doi = ! empty($entry['doi']) ? ". Tersedia di: https://doi.org/{$entry['doi']}" : '';

        return "{$authors} ({$year}) {$body}{$doi}.";
    }

    private static function chicago(array $entry): string
    {
        $year = $entry['year'] ?? 'n.d.';
        $authors = self::chicagoAuthors($entry['authors'] ?? []);
        $title = '"'.($entry['title'] ?? 'Tanpa judul').'"';
        $container = $entry['container'] ?? null;

        $body = $container
            ? "{$title}. *{$container}*"
                .(! empty($entry['volume']) ? " {$entry['volume']}" : '')
                .(! empty($entry['issue']) ? ", no. {$entry['issue']}" : '')
                .(! empty($entry['pages']) ? ": {$entry['pages']}" : '')
            : $title;

        $doi = ! empty($entry['doi']) ? ". https://doi.org/{$entry['doi']}" : '';

        return "{$authors}. {$year}. {$body}{$doi}.";
    }

    private static function ieee(array $entry): string
    {
        $authors = $entry['authors'] ?? [];

        $authorText = match (true) {
            count($authors) === 0 => 'Anonim',
            count($authors) <= 6 => self::joinFamilies($authors, self::LIST_SEP, self::AND_SEP),
            default => self::initials($authors[0]).' '.($authors[0]['family'] ?? '').' et al.',
        };

        $year = ! empty($entry['year']) ? ", {$entry['year']}" : '';
        $container = ! empty($entry['container']) ? ", *{$entry['container']}*" : '';
        $volume = ! empty($entry['volume']) ? ", vol. {$entry['volume']}" : '';
        $issue = ! empty($entry['issue']) ? ", no. {$entry['issue']}" : '';
        $pages = ! empty($entry['pages']) ? ', pp. '.str_replace('–', '-', $entry['pages']) : '';
        $doi = ! empty($entry['doi']) ? ", doi: {$entry['doi']}" : '';

        return "{$authorText}, \"{$entry['title']}\"{$container}{$volume}{$issue}{$pages}{$year}{$doi}.";
    }

    private static function apaAuthors(array $authors): string
    {
        if (empty($authors)) {
            return 'Anonim.';
        }

        // APA 7: hingga 20 penulis didaftar seluruhnya; ke-21+ dipotong setelah ke-19.
        $truncated = count($authors) > 20;
        $shown = $truncated ? array_slice($authors, 0, 19) : $authors;

        $formatted = array_map(
            fn (array $author) => trim(($author['family'] ?? '').', '.self::initials($author), ', '),
            $shown
        );

        if ($truncated) {
            $last = end($authors);

            return implode(', ', $formatted).', ... '.trim(($last['family'] ?? '').', '.self::initials($last), ', ');
        }

        if (count($formatted) === 1) {
            return $formatted[0];
        }

        $last = array_pop($formatted);

        return implode(', ', $formatted).', & '.$last;
    }

    private static function chicagoAuthors(array $authors): string
    {
        if (empty($authors)) {
            return 'Anonim';
        }

        $first = trim(($authors[0]['family'] ?? '').', '.($authors[0]['given'] ?? ''), ', ');
        $rest = array_slice($authors, 1);

        if (empty($rest)) {
            return $first;
        }

        return $first.', '.implode(', ', array_map(
            fn (array $author) => trim(($author['given'] ?? '').' '.($author['family'] ?? '')),
            $rest
        ));
    }

    /** "Eko Arik" -> "E. A." */
    private static function initials(array $author): string
    {
        $given = $author['given'] ?? '';

        if ($given === '') {
            return '';
        }

        $initials = array_map(
            fn (string $part) => mb_strtoupper(mb_substr($part, 0, 1)).'.',
            array_filter(preg_split('/[\s.-]+/', $given) ?: [])
        );

        return implode(' ', $initials);
    }

    private static function joinFamilies(array $authors, string $separator, string $lastSeparator): string
    {
        $families = array_values(array_filter(array_map(
            fn (array $author) => $author['family'] ?? '',
            $authors
        )));

        if (count($families) <= 1) {
            return $families[0] ?? 'Anonim';
        }

        $last = array_pop($families);

        return implode($separator, $families).$lastSeparator.$last;
    }
}
