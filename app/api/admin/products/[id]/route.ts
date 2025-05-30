// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth';
import { 
  getProductById, 
  executeQuery,
  categoryExists,
  barcodeExists,
  isProductInUse 
} from '../../../../../lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = await context.params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
      );
    }
    
    const product = await getProductById(productId);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ product }, { status: 200 });
    
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = await context.params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
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
    
    // Verificar que el producto existe
    const existingProduct = await getProductById(productId);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
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
    
    // Verificar código de barras único (si se proporciona y es diferente)
    if (codigo_barras && codigo_barras.trim() !== '') {
      const barcodeInUse = await barcodeExists(codigo_barras.trim(), productId);
      if (barcodeInUse) {
        return NextResponse.json(
          { error: 'El código de barras ya existe' },
          { status: 400 }
        );
      }
    }
    
    // Actualizar el producto
    const query = `
      UPDATE productos 
      SET nombre = ?, descripcion = ?, precio = ?, costo = ?, categoria_id = ?, 
          codigo_barras = ?, stock = ?, stock_minimo = ?, activo = ?,
          fecha_actualizacion = NOW()
      WHERE producto_id = ?
    `;
    
    await executeQuery({
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
        activo ? 1 : 0,
        productId
      ]
    });
    
    return NextResponse.json({
      message: 'Producto actualizado exitosamente'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { id } = await context.params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
      );
    }
    
    // Verificar que el producto existe
    const existingProduct = await getProductById(productId);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el producto está siendo usado en órdenes
    const productInUse = await isProductInUse(productId);
    
    if (productInUse) {
      // No eliminar, solo desactivar
      await executeQuery({
        query: `
          UPDATE productos 
          SET activo = FALSE, fecha_actualizacion = NOW()
          WHERE producto_id = ?
        `,
        values: [productId]
      });
      
      return NextResponse.json({
        message: 'Producto desactivado (no se puede eliminar porque está en uso)'
      }, { status: 200 });
    }
    
    // Eliminar el producto si no está en uso
    await executeQuery({
      query: `DELETE FROM productos WHERE producto_id = ?`,
      values: [productId]
    });
    
    return NextResponse.json({
      message: 'Producto eliminado exitosamente'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el producto' },
      { status: 500 }
    );
  }
}