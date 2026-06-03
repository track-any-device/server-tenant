<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Services\PlatformApiClient;
use Inertia\Inertia;
use Inertia\Response;

class AssigneeController extends Controller
{
    public function __construct(private PlatformApiClient $api) {}

    public function index(): Response
    {
        $assignees = $this->api->assignees();

        return Inertia::render('assignees/index', [
            'assignees' => $assignees,
        ]);
    }

    public function show(int $id): Response
    {
        $assignee = $this->api->assignee($id);

        return Inertia::render('assignees/show', [
            'assignee' => $assignee,
        ]);
    }
}
