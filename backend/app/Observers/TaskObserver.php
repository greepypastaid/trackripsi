<?php

namespace App\Observers;

use App\Models\Task;

class TaskObserver
{
    public function saved(Task $task): void
    {
        $this->recalculate($task);
    }

    public function deleted(Task $task): void
    {
        $this->recalculate($task);
    }

    private function recalculate(Task $task): void
    {
        $chapter = $task->chapter()->withCount([
            'tasks',
            'tasks as completed_tasks_count' => fn ($q) => $q->where('is_completed', true),
        ])->first();

        if (! $chapter) {
            return;
        }

        $chapter->progress_percent = $chapter->tasks_count > 0
            ? (int) round($chapter->completed_tasks_count / $chapter->tasks_count * 100)
            : 0;

        $chapter->saveQuietly();
    }
}
