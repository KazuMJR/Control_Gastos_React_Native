<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presupuestos_mensuales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('mes', 7);
            $table->decimal('monto', 12, 2);
            $table->timestamps();

            $table->unique(['user_id', 'mes']);
        });

        Schema::create('distribuciones_presupuesto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('presupuesto_mensual_id')
                ->constrained('presupuestos_mensuales')
                ->cascadeOnDelete();
            $table->foreignId('categoria_id')->constrained('categorias')->cascadeOnDelete();
            $table->decimal('monto', 12, 2);
            $table->timestamps();

            $table->unique(['presupuesto_mensual_id', 'categoria_id']);
        });

        Schema::create('pagos_pendientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->foreignId('gasto_id')->nullable()->unique()->constrained('gastos')->nullOnDelete();
            $table->string('descripcion');
            $table->decimal('monto', 12, 2);
            $table->date('fecha_vencimiento');
            $table->string('estado', 20)->default('pendiente');
            $table->date('fecha_pago')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'estado', 'fecha_vencimiento']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_pendientes');
        Schema::dropIfExists('distribuciones_presupuesto');
        Schema::dropIfExists('presupuestos_mensuales');
    }
};
