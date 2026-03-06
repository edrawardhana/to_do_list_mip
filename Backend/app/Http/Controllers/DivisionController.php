<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Division;

class DivisionController extends Controller
{
    public function index()
    {
        $divisions = Division::select('id', 'name')->orderBy('name', 'asc')->get();
        return response()->json($divisions, 200);
    }
}
