<?php

namespace Modules\Jury\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Student;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Promotion;
use Illuminate\Support\Facades\DB;
use Modules\Jury\Services\JuryService;

class JuryDashboardController extends Controller
{
    private $juryService;

    public function __construct(JuryService $juryService)
    {
        $this->juryService = $juryService;
    }

    public function index(Request $request)
    {
        $context = $request->session()->get('jury_context');

        if (!$context) {
            abort(403, 'Jury context not set. Please select an academic year and promotion.');
        }

        $academicYear = AcademicYear::find($context['academic_year_id']);
        $promotion = Promotion::find($context['promotion_id']);

        $courses = $this->juryService->getDashboardCourses($context);
        $successRates = $this->juryService->getSuccessRates($context);

        return Inertia::render('jury/dashboard', [
            'academicYear' => $academicYear,
            'promotion' => $promotion,
            'courses' => $courses,
            'successRates' => $successRates
        ]);
    }
}
