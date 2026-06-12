<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class IncidentController extends Controller
{
    public function index(Request $request): Response
    {
        $incidents = Incident::with('device')
            ->when(
                $request->string('status')->isNotEmpty(),
                fn ($q) => $q->where('status', $request->string('status')->toString()),
            )
            ->when(
                $request->filled('device_id'),
                fn ($q) => $q->where('device_id', $request->integer('device_id')),
            )
            ->latest('triggered_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Incident $incident) => $incident->toPortalArray());

        return Inertia::render('incidents/index', [
            'incidents' => $incidents,
            'filters' => $request->only(['status']),
        ]);
    }

    public function show(int $id): Response
    {
        $incident = Incident::with('device')->findOrFail($id);

        return Inertia::render('incidents/show', [
            'incident' => $incident->toPortalArray(),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $incident = Incident::findOrFail($id);

        $data = $request->validate([
            'status' => ['required', Rule::in([
                Incident::STATUS_OPEN,
                Incident::STATUS_ACKNOWLEDGED,
                Incident::STATUS_RESOLVED,
            ])],
            'resolution_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $incident->update([
            'status' => $data['status'],
            'resolution_notes' => $data['resolution_notes'] ?? $incident->resolution_notes,
            'resolved_at' => $data['status'] === Incident::STATUS_RESOLVED ? now() : null,
        ]);

        return response()->json($incident->fresh('device')->toPortalArray());
    }
}
