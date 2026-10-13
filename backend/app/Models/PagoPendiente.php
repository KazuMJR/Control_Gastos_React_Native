<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PagoPendiente extends Model
{
    protected $table = 'pagos_pendientes';

    protected $attributes = ['estado' => 'pendiente'];

    protected $fillable = [
        'user_id',
        'categoria_id',
        'gasto_id',
        'descripcion',
        'monto',
        'fecha_vencimiento',
        'estado',
        'fecha_pago',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'fecha_vencimiento' => 'date',
            'fecha_pago' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function gasto()
    {
        return $this->belongsTo(Gasto::class);
    }
}
