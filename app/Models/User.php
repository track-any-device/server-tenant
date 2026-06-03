<?php

namespace App\Models;

use TrackAnyDevice\Core\Models\User as CoreUser;

/**
 * Thin alias — delegates everything to the central platform User model.
 *
 * UsesCentralConnection in CoreUser directs auth queries to the central
 * MySQL database (DB_* env vars pointing at the platform DB).
 * Sessions are stored in the same DB, scoped by SESSION_COOKIE per tenant.
 */
class User extends CoreUser {}
