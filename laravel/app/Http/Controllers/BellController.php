<?php

namespace App\Http\Controllers;
use App\Models\Bell;

use Illuminate\Http\Request;

class BellController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() {
        return Bell::all();
    }

}
