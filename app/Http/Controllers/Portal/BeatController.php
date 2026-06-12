<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Beats are managed on the central platform and are not part of the
 * standalone tenant data set (devices, signals, incidents). The page is
 * kept so navigation stays intact — it renders its built-in empty state.
 */
class BeatController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('beats/index', [
            'beats' => [],
        ]);
    }

    public function show(int $id): Response
    {
        abort(404);
    }
}
