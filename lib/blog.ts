// lib/blog.ts (Utility functions for blog)
export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    date: string;
    slug: string;
    author: string;
    readTime: string;
    tags: string[];
    featured: boolean;
  }
  
  export const getAllPosts = (): BlogPost[] => {
    // En una aplicación real, esto vendría de una base de datos o CMS
    return [
      {
        id: '1',
        title: "Guía completa para limpiar zapatillas blancas",
        excerpt: "Aprende los mejores trucos y técnicas para mantener tus zapatillas blancas impecables por más tiempo.",
        content: "Contenido completo del artículo...",
        image: "/assets/blog/white-sneakers.jpg",
        date: "2025-04-12",
        slug: "guia-limpiar-zapatillas-blancas",
        author: "VIP Sneaker Care",
        readTime: "8 min",
        tags: ["Limpieza", "Zapatillas Blancas", "Cuidado"],
        featured: true
      },
      // ... más posts
    ];
  };
  
  export const getPostBySlug = (slug: string): BlogPost | undefined => {
    return getAllPosts().find(post => post.slug === slug);
  };
  
  export const getFeaturedPosts = (): BlogPost[] => {
    return getAllPosts().filter(post => post.featured);
  };
  
  export const getPostsByTag = (tag: string): BlogPost[] => {
    return getAllPosts().filter(post => 
      post.tags.some(postTag => 
        postTag.toLowerCase().includes(tag.toLowerCase())
      )
    );
  };
  