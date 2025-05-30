// app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth';
import { executeQuery } from '../../../../../lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = await context.params;
    const categoryId = parseInt(id, 10);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'ID de categoría inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { nombre, descripcion, activo } = body;
    
    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      );
    }
    
    // Verificar que la categoría existe
    const existingCategory = await executeQuery<any[]>({
      query: `SELECT categoria_id FROM categorias_productos WHERE categoria_id = ?`,
      values: [categoryId]
    });
    
    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar que no existe otra categoría con el mismo nombre
    const duplicateCategory = await executeQuery<any[]>({
      query: `SELECT categoria_id FROM categorias_productos WHERE nombre = ? AND categoria_id != ?`,
      values: [nombre.trim(), categoryId]
    });
    
    if (duplicateCategory.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }
    
    // Actualizar la categoría
    await executeQuery({
      query: `
        UPDATE categorias_productos 
        SET nombre = ?, descripcion = ?, activo = ?, fecha_actualizacion = NOW()
        WHERE categoria_id = ?
      `,
      values: [
        nombre.trim(),
        descripcion?.trim() || null,
        activo ? 1 : 0,
        categoryId
      ]
    });
    
    return NextResponse.json({
      message: 'Categoría actualizada exitosamente'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la categoría' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = await context.params;
    const categoryId = parseInt(id, 10);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'ID de categoría inválido' },
        { status: 400 }
      );
    }
    
    // Verificar que la categoría existe
    const existingCategory = await executeQuery<any[]>({
      query: `SELECT categoria_id FROM categorias_productos WHERE categoria_id = ?`,
      values: [categoryId]
    });
    
    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar si la categoría está siendo usada por productos
    const productsUsingCategory = await executeQuery<any[]>({
      query: `SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?`,
      values: [categoryId]
    });
    
    if (productsUsingCategory[0].count > 0) {
      // No eliminar, solo desactivar
      await executeQuery({
        query: `
          UPDATE categorias_productos 
          SET activo = FALSE, fecha_actualizacion = NOW()
          WHERE categoria_id = ?
        `,
        values: [categoryId]
      });
      
      return NextResponse.json({
        message: 'Categoría desactivada (no se puede eliminar porque tiene productos asociados)'
      }, { status: 200 });
    }
    
    // Eliminar la categoría si no está en uso
    await executeQuery({
      query: `DELETE FROM categorias_productos WHERE categoria_id = ?`,
      values: [categoryId]
    });
    
    return NextResponse.json({
      message: 'Categoría eliminada exitosamente'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la categoría' },
      { status: 500 }
    );
  }
}