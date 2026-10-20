<?php

namespace App\Policies;

use App\Models\Research;
use App\Models\User;

class ResearchPolicy
{
    public function view(User $user, Research $research): bool
    {
        return $research->user_id === $user->id;
    }

    public function update(User $user, Research $research): bool
    {
        return $this->view($user, $research);
    }

    public function delete(User $user, Research $research): bool
    {
        return $this->view($user, $research);
    }
}
