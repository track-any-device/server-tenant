<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Services\PlatformApiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IncidentController extends Controller
{
    public function __construct(private PlatformApiClient $api) {}

    public function index(Request $request): Response
    {
        $incidents = $this->api->incidents(
            $request->only(['status', 'device_id', 'page'])
        );

        return Inertia::render('incidents/index', [
            'incidents' => $incidents,
            'filters'   => $request->only(['status']),
        ]);
    }

    public function show(int $id): Response
    {
        $incident = $this->api->incident($id);

        return Inertia::render('incidents/show', [
            'incident' => $incident,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data     = $request->validate([
            'status'           => ['required', 'string'],
            'resolution_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $incident = $this->api->updateIncident($id, $data);

        return response()->json($incident);
    }
}
