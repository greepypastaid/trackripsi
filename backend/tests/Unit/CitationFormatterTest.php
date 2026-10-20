<?php

use App\Support\CitationFormatter;

function entry(array $overrides = []): array
{
    return array_merge([
        'title' => 'Analisis Faktor Stres Skripsi',
        'authors' => [
            ['family' => 'Susmiatin', 'given' => 'Eko Arik'],
            ['family' => 'Ishariani', 'given' => 'Linda'],
            ['family' => 'Kartikasari', 'given' => 'Mega'],
        ],
        'year' => 2025,
        'container' => 'Jurnal Ilmiah Kesehatan',
        'volume' => '4',
        'issue' => '1',
        'pages' => '50–57',
        'doi' => '10.70570/jikmc.v4i1.1568',
        'url' => null,
    ], $overrides);
}

it('formats an apa7 reference with three authors', function () {
    $reference = CitationFormatter::reference(entry(), 'apa7');

    expect($reference)
        ->toContain('Susmiatin, E. A., Ishariani, L., & Kartikasari, M.')
        ->toContain('(2025).')
        ->toContain('*Jurnal Ilmiah Kesehatan*, 4(1), 50–57')
        ->toContain('https://doi.org/10.70570/jikmc.v4i1.1568');
});

it('formats in-text citations per style', function () {
    $data = entry();

    expect(CitationFormatter::inText($data, 'apa7'))->toBe('(Susmiatin et al., 2025)');
    expect(CitationFormatter::inText(entry(['authors' => [$data['authors'][0]]]), 'apa7'))
        ->toBe('(Susmiatin, 2025)');
    expect(CitationFormatter::inText($data, 'ieee'))->toBe('[1]');
});

it('formats an ieee reference', function () {
    $reference = CitationFormatter::reference(entry(), 'ieee');

    expect($reference)
        ->toContain('Susmiatin, Ishariani and Kartikasari')
        ->toContain('vol. 4')
        ->toContain('no. 1')
        ->toContain('pp. 50-57');
});

it('handles entries without authors or year', function () {
    $reference = CitationFormatter::reference(entry(['authors' => [], 'year' => null]), 'apa7');

    expect($reference)->toContain('Anonim. (n.d.).');
});

it('lists up to twenty authors for apa7', function () {
    $authors = array_map(
        fn (int $i) => ['family' => "Penulis{$i}", 'given' => 'A'],
        range(1, 21)
    );

    $reference = CitationFormatter::reference(entry(['authors' => $authors]), 'apa7');

    expect($reference)->toContain('Penulis19, A.');
    expect($reference)->toContain('... Penulis21, A.');
});

it('escapes raw html coming from third-party entries', function () {
    $reference = CitationFormatter::reference(entry(['title' => '<script>x</script>']), 'apa7');

    expect($reference)->toContain('&lt;script&gt;')->not->toContain('<script');
});
