<?php

use App\Services\LiteratureMetadata;

it('reconstructs an inverted abstract in word order', function () {
    $index = [
        'Penelitian' => [0],
        'ini' => [1],
        'menguji' => [2],
        'faktor' => [3],
        'stres' => [4],
    ];

    expect(LiteratureMetadata::reconstructAbstract($index))
        ->toBe('Penelitian ini menguji faktor stres');
});

it('reconstructs duplicated word positions correctly', function () {
    $index = ['ada' => [0, 2], 'yang' => [1]];

    expect(LiteratureMetadata::reconstructAbstract($index))->toBe('ada yang ada');
});

it('returns null for an empty abstract', function () {
    expect(LiteratureMetadata::reconstructAbstract(null))->toBeNull();
    expect(LiteratureMetadata::reconstructAbstract([]))->toBeNull();
});

it('normalizes doi strings', function () {
    expect(LiteratureMetadata::normalizeDoi('https://doi.org/10.1234/ABCD'))
        ->toBe('10.1234/abcd');
    expect(LiteratureMetadata::normalizeDoi('doi: 10.1234/abcd'))
        ->toBe('10.1234/abcd');
    expect(LiteratureMetadata::normalizeDoi(' 10.1234/abcd '))
        ->toBe('10.1234/abcd');
});
