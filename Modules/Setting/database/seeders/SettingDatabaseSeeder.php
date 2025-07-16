<?php

namespace Modules\Setting\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;
use Modules\Setting\Entities\Setting;

class SettingDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Setting::create([
            'company_name' => 'EsuDelib',
            'company_email' => 'company@test.com',
            'company_phone' => '+243977107225',
            'notification_email' => 'notification@test.com',
            'default_currency_id' => 1,
            'default_currency_position' => 'prefix',
            'footer_text' => 'EsuDelib © 2024 || Dévelopé par <strong><a target="_blank" href="https://www.linkedin.com/in/jeancy-grys-kalunga">Jeancy Grys Kalunga</a></strong>',
            'company_address' => 'Lubumbashi, RDC'
        ]);
    }
}
