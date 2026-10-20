<?php

namespace Database\Seeders;

use App\Models\DefenseQuestion;
use Illuminate\Database\Seeder;

/**
 * Bank pertanyaan sidang (F6). Global, bukan per user.
 * Sumber pola: LITERA 17(2) 2018 — pertanyaan penguji dominan motivasi, kebaruan, metode.
 */
class DefenseQuestionSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            // Bab 1
            [1, 'motivasi', 'Mengapa Anda memilih topik penelitian ini?'],
            [1, 'motivasi', 'Apa urgensi masalah yang Anda angkat bagi pengguna atau bidang studi?'],
            [1, 'kebaruan', 'Apa kebaruan penelitian Anda dibanding penelitian sebelumnya?'],
            [1, 'teori', 'Teori apa yang menjadi landasan utama penelitian ini dan mengapa?'],
            [1, 'teori', 'Jelaskan perbedaan penelitian Anda dengan penelitian terdahulu yang paling mirip.'],
            // Bab 2
            [2, 'teori', 'Bagaimana Anda menyusun kerangka pemikiran dari teori-teori yang dipakai?'],
            [2, 'kebaruan', 'Posisi penelitian Anda di antara penelitian terdahulu seperti apa?'],
            [2, 'teori', 'Mengapa istilah kunci dalam penelitian ini didefinisikan seperti itu?'],
            // Bab 3
            [3, 'metode', 'Mengapa Anda memilih metode ini, bukan metode lain?'],
            [3, 'metode', 'Bagaimana Anda memastikan validitas atau keabsahan data?'],
            [3, 'metode', 'Apa keterbatasan metodologis penelitian Anda dan bagaimana mengatasinya?'],
            [3, 'sampling', 'Bagaimana teknik pengambilan sampel Anda dan mengapa memakai teknik itu?'],
            [3, 'sampling', 'Berapa jumlah sampel minimal yang seharusnya dan bagaimana Anda menentukannya?'],
            [3, 'metode', 'Bagaimana prosedur pengumpulan data Anda lakukan secara rinci?'],
            // Bab 4
            [4, 'hasil', 'Mengapa hasil Anda menunjukkan pola seperti itu?'],
            [4, 'hasil', 'Bagaimana Anda menjelaskan temuan yang tidak sesuai dengan hipotesis atau teori?'],
            [4, 'hasil', 'Apa implikasi praktis temuan Anda?'],
            [4, 'hasil', 'Bagaimana Anda mengukur keberhasilan sistem atau model yang diajukan?'],
            // Bab 5
            [5, 'motivasi', 'Apa simpulan utama yang harus dicatat dari penelitian ini?'],
            [5, 'motivasi', 'Apa saran untuk penelitian selanjutnya?'],
        ];

        foreach ($questions as [$chapter, $category, $text]) {
            DefenseQuestion::firstOrCreate(
                ['text' => $text],
                ['chapter_order' => $chapter, 'category' => $category]
            );
        }
    }
}
