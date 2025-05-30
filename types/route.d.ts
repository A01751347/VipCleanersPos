// types/route.d.ts
import { NextRequest } from 'next/server';

declare global {
  // Define el tipo para los controladores de ruta con parámetros dinámicos
  type RouteSegmentConfig = {
    dynamic?: 'auto' | 'force-dynamic' | 'error' | 'force-static';
    dynamicParams?: boolean;
    revalidate?: false | 0 | number;
    fetchCache?: 'auto' | 'default-cache' | 'only-cache' | 'force-cache' | 'force-no-store' | 'default-no-store' | 'only-no-store';
    runtime?: 'nodejs' | 'edge';
    preferredRegion?: 'auto' | 'global' | 'home' | string | string[];
  };

  type RouteHandlerConfig = RouteSegmentConfig;

  // Define la interfaz para los parámetros
  interface Params {
    [key: string]: string;
  }

  // Define el tipo para las funciones de ruta (GET, POST, etc.)
  type RouteHandler<T extends Params = Params> = (
    req: NextRequest,
    context: { params: T }
  ) => Promise<Response> | Response;

  // Define alias para cada método HTTP
  interface RouteHandlerFunctions {
    GET?: RouteHandler<any>;
    POST?: RouteHandler<any>;
    PUT?: RouteHandler<any>;
    DELETE?: RouteHandler<any>;
    PATCH?: RouteHandler<any>;
    HEAD?: RouteHandler<any>;
    OPTIONS?: RouteHandler<any>;
  }
}