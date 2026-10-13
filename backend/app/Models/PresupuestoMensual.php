<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PresupuestoMensual extends Model
{
    protected $table = 'presupuestos_mensuales';

    protected $fillable = ['user_id', 'mes', 'monto'];

    protected function casts(): array
    {
        return ['monto' => 'decimal:2'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function distribuciones()
    {
        return $this->hasMany(DistribucionPresupuesto::class);
    }
}
