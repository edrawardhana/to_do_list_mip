<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Division;
use Illuminate\Support\Facades\Validator;

class DivisionController extends Controller
{
    public function index()
    {
        $divisions = Division::select('id', 'name', 'icon', 'color', 'head', 'description', 'job_descriptions')->orderBy('name', 'asc')->get();
        return response()->json($divisions, 200);
    }

    public function analytics()
    {
        $divisions = Division::with(['profiles' => function ($query) {
            $query->select('id', 'full_name', 'role', 'division_id', 'avatar_url');
        }])->orderBy('name', 'asc')->get();

        $data = $divisions->map(function ($div) {
            $interns = $div->profiles->filter(fn($p) => in_array($p->role, ['intern', 'user']));
            $admins  = $div->profiles->filter(fn($p) => $p->role === 'admin');

            $members = $div->profiles->map(function ($p) {
                return [
                    'id'     => $p->id,
                    'name'   => $p->full_name,
                    'role'   => str_replace('_', ' ', strtoupper($p->role)),
                    'avatar' => mb_substr($p->full_name, 0, 1),
                ];
            })->values();

            $leaderboard = $interns->take(5)->map(function ($p, $index) {
                return [
                    'name'   => $p->full_name,
                    'status' => $index % 3 === 0 ? 'Warning' : 'Active',
                ];
            })->values();

            return [
                'id'              => $div->id,
                'name'            => $div->name,
                'icon'            => $div->icon,
                'color'           => $div->color,
                'head'            => $div->head,
                'description'     => $div->description,
                'internCount'     => $interns->count(),
                'performance'     => rand(75, 98),
                'jobDescriptions' => is_array($div->job_descriptions)
                    ? array_map(fn($t) => is_array($t) ? $t : ['task' => $t], $div->job_descriptions)
                    : [],
                'members'         => $members,
                'leaderboard'     => $leaderboard,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $data,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $division = Division::create([
            'name' => $request->name,
            'icon' => $request->icon ?? 'fa-building',
            'color' => $request->color ?? 'blue',
            'head' => $request->head,
            'description' => $request->description,
            'job_descriptions' => $request->job_descriptions ?? [],
        ]);

        return response()->json($division, 201);
    }

    public function update(Request $request, $id)
    {
        $division = Division::findOrFail($id);

        $division->update([
            'name' => $request->name ?? $division->name,
            'icon' => $request->icon ?? $division->icon,
            'color' => $request->color ?? $division->color,
            'head' => $request->head ?? $division->head,
            'description' => $request->description ?? $division->description,
            'job_descriptions' => tap($request->job_descriptions, function(&$j) use ($division) { if(is_null($j)) $j = $division->job_descriptions; })
        ]);

        return response()->json($division, 200);
    }

    public function destroy($id)
    {
        $division = Division::findOrFail($id);
        
        if ($division->profiles()->count() > 0) {
            return response()->json(['error' => 'Tidak bisa menghapus divisi yang masih memiliki user didalamnya'], 400);
        }

        $division->delete();
        return response()->json(['message' => 'Berhasil menghapus divisi'], 200);
    }
}
