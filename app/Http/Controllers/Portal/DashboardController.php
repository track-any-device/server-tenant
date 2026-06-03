<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Services\PlatformApiClient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private PlatformApiClient $api) {}

    public function __invoke(Request $request): Response
    {
        $devices   = $this->api->devices(['per_page' => 1]);
        $incidents = $this->api->incidents(['status' => 'open', 'per_page' => 5]);

        return Inertia::render('dashboard', [
            'deviceCount'      => data_get($devices, 'total', 0),
            'openIncidents'    => $incidents,
        ]);
    }
}
