// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth';
import { 
  getInventory, 
  getAllProductCategories, 
  getProductsByCategory,
  searchProducts,
  executeQuery,
  categoryExists,
  barcodeExists
} from '../../../../lib/database';

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
    
    // Caso: Obtener categorías de productos
    if (searchParams.get('categories') === 'true') {
      const onlyActive = searchParams.get('onlyActive') !== 'false';
      const categories = await getAllProductCategories(onlyActive);
      return NextResponse.json({ categories }, { status: 200 });
    }
    
    // Caso: Obtener productos de una categoría
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      const onlyActive = searchParams.get('onlyActive') !== 'false';
      const products = await getProductsByCategory(parseInt(categoryId, 10), onlyActive);
      return NextResponse.json({ products }, { status: 200 });
    }
    
    // Caso: Buscar productos
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      const onlyActive = searchParams.get('onlyActive') !== 'false';
      const products = await searchProducts(searchTerm, onlyActive);
      return NextResponse.json({ products }, { status: 200 });
    }
    
    // Caso: Obtener inventario con filtros
    const categoryIdFilter = searchParams.get('categoryIdFilter');
    const onlyLowStock = searchParams.get('onlyLowStock') === 'true';
    const searchQuery = searchParams.get('searchQuery');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    
    const inventory = await getInventory({
      categoryId: categoryIdFilter ? parseInt(categoryIdFilter, 10) : null,
      onlyLowStock,
      searchQuery: searchQuery || null,
      page,
      pageSize
    });
    
    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    console.error('Error al obtener productos:', error);
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
    const { 
      nombre, 
      descripcion, 
      precio,
      costo,
      categoria_id,
      codigo_barras,
      stock,
      stock_minimo,
      activo 
    } = body;
    
    // Validaciones
    if (!nombre || !categoria_id || precio === undefined) {
      return NextResponse.json(
        { error: 'Datos requeridos faltantes' },
        { status: 400 }
      );
    }
    
    if (typeof precio !== 'number' || precio < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido' },
        { status: 400 }
      );
    }
    
    if (typeof categoria_id !== 'number' || categoria_id <= 0) {
      return NextResponse.json(
        { error: 'ID de categoría inválido' },
        { status: 400 }
      );
    }
    
    // Verificar que la categoría existe
    const categoryIsValid = await categoryExists(categoria_id);
    if (!categoryIsValid) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 400 }
      );
    }
    
    // Verificar código de barras único (si se proporciona)
    if (codigo_barras && codigo_barras.trim() !== '') {
      const barcodeInUse = await barcodeExists(codigo_barras.trim());
      if (barcodeInUse) {
        return NextResponse.json(
          { error: 'El código de barras ya existe' },
          { status: 400 }
        );
      }
    }
    
    // Crear el producto
    const query = `
      INSERT INTO productos (
        nombre, descripcion, precio, costo, categoria_id, codigo_barras,
        stock, stock_minimo, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery<any>({
      query,
      values: [
        nombre.trim(),
        descripcion?.trim() || null,
        
        precio,
        costo || 0,
        categoria_id,
        codigo_barras?.trim() || null,
        stock || 0,
        stock_minimo || 0,
        activo ? 1 : 0
      ]
    });
    
    return NextResponse.json({
      message: 'Producto creado exitosamente',
      productId: result.insertId
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { error: 'Error al crear el producto' },
      { status: 500 }
    );
  }
}