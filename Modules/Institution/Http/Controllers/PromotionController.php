<?php

namespace Modules\Institution\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\RedirectResponse;
use Modules\Institution\Entities\Faculty;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Http\Requests\PromotionRequest;

class PromotionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        abort_if(Gate::denies('access_promotions'), 403);
        $promotions = Promotion::orderBy('id', 'desc')->get();
        return view('institution::promotions.index', [
            'promotions' => $promotions
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('institution::promotions.form', [
            'promotion' => new Promotion(),
            'institutions' => Institution::select('id', 'name')->get(),
            'faculties' => Faculty::select('id', 'title')->get()
        ]);

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PromotionRequest $request)
    {
        abort_if(Gate::denies('create_promotions'), 403);

        $promotion = Promotion::create($request->validated());

        if($promotion)
        {
            toast('Promotion enregistrée avec succès !', 'success');

        }else{
            toast("Une erreur survenue lors de l'enregistrement de la promotion", 'error');
        }
    
        return redirect()->route('promotions.index');

    }

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        return view('institution::show');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Promotion $promotion)
    {
        
        abort_if(Gate::denies('edit_promotions'), 403);
        $promotion = Promotion::findOrFail($promotion);
        return view('institution::promotions.form', [
            'promotion' => $promotion,
            'institutions' => Institution::select('id', 'name')->get(),
            'faculties' => Faculty::select('id', 'title')->get()
        ]); 
    
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PromotionRequest $request, Promotion $promotion)
    {
        abort_if(Gate::denies('edit_promotions'), 403);

        $promotion = Promotion::findOrFail($promotion);
        $promotion->update($request->validated());

        if($promotion)
        {
            toast('Promotion modifiée avec succès !', 'success');

        }else{
            toast("Une erreur survenue lors de la modification de la promotion", 'error');
        }
    
        return redirect()->route('promotions.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Promotion $promotion)
    {
        abort_if(Gate::denies('delete_promotions'), 403);

        $promotion = Promotion::findOrFail($promotion);
        $promotion->delete();

        if($promotion)
        {
            toast('Promotion supprimée avec succès !', 'success');

        }else{
            toast("Une erreur survenue lors de la suppression de la promotion", 'error');
        }
    
        return redirect()->route('promotions.index');
    }
}
