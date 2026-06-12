<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Incident;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $openIncidents = Incident::with('device')
            ->where('status', Incident::STATUS_OPEN)
            ->latest('triggered_at')
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'deviceCount' => Device::count(),
            'openIncidents' => [
                'data' => $openIncidents->map(fn (Incident $i) => $i->toPortalArray())->all(),
                'total' => Incident::where('status', Incident::STATUS_OPEN)->count(),
            ],
        ]);
    }
}
