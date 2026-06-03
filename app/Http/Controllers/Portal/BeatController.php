<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Services\PlatformApiClient;
use Inertia\Inertia;
use Inertia\Response;

class BeatController extends Controller
{
    public function __construct(private PlatformApiClient $api) {}

    public function index(): Response
    {
        $beats = $this->api->beats();

        return Inertia::render('beats/index', [
            'beats' => $beats,
        ]);
    }

    public function show(int $id): Response
    {
        $beat = $this->api->beat($id);

        return Inertia::render('beats/show', [
            'beat' => $beat,
        ]);
    }
}
