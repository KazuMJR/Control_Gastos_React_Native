<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DistribucionPresupuesto extends Model
{
    protected $table = 'distribuciones_presupuesto';

    protected $fillable = ['presupuesto_mensual_id', 'categoria_id', 'monto'];

    protected function casts(): array
    {
        return ['monto' => 'decimal:2'];
    }

    public function presupuestoMensual()
    {
        return $this->belongsTo(PresupuestoMensual::class);
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }
}
