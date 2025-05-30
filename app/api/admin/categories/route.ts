// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { 
  getAllProductCategories,
  createProductCategory,
  executeQuery
} from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('onlyActive') !== 'false';
    
    const categories = await getAllProductCategories(onlyActive);
    
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
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
    
    // Verificar que no existe una categoría con el mismo nombre
    const existingCategory = await executeQuery<any[]>({
      query: `SELECT categoria_id FROM categorias_productos WHERE nombre = ?`,
      values: [nombre.trim()]
    });
    
    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }
    
    // Crear la categoría
    const categoryId = await createProductCategory({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      activo: activo !== false
    });
    
    return NextResponse.json({
      message: 'Categoría creada exitosamente',
      categoryId
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear categoría:', error);
    return NextResponse.json(
      { error: 'Error al crear la categoría' },
      { status: 500 }
    );
  }
}