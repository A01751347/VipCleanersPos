import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { BlogPost } from '../lib/blog';

interface BlogCardProps {
  post: BlogPost;
  variant?: 'default' | 'featured' | 'compact';
}

const BlogCard: React.FC<BlogCardProps> = ({ post, variant = 'default' }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const baseClasses = "bg-white rounded-xl overflow-hidden shadow-[0_10px_15px_-3px_rgba(49,61,82,0.1),0_4px_6px_-2px_rgba(49,61,82,0.05)] hover:shadow-lg transition-all duration-300 group";
  
  if (variant === 'featured') {
    return (
      <article className={`${baseClasses} md:flex`}>
        <Link href={`/blog/${post.slug}`} className="block md:w-1/2">
          <div className="relative overflow-hidden">
            <div 
              className="h-64 md:h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
              style={{ backgroundImage: `url(${post.image})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
              <div className="absolute top-4 left-4">
                <span className="bg-[#78f3d3] text-[#313D52] px-3 py-1 rounded-full text-xs font-semibold">
                  Destacado
                </span>
              </div>
            </div>
          </div>
        </Link>
        
        <div className="p-8 md:w-1/2 flex flex-col justify-center">
          <div className="flex items-center justify-between text-sm text-[#6c7a89] mb-3">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              <span>{formatDate(post.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>{post.readTime}</span>
            </div>
          </div>
          
          <Link href={`/blog/${post.slug}`}>
            <h3 className="text-2xl font-bold text-[#313D52] mb-4 hover:text-[#78f3d3] transition-colors cursor-pointer">
              {post.title}
            </h3>
          </Link>
          
          <p className="text-[#6c7a89] mb-6 text-lg leading-relaxed">{post.excerpt}</p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="bg-[#f5f9f8] text-[#313D52] px-3 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-[#6c7a89]">
              <User size={14} className="mr-1" />
              <span>{post.author}</span>
            </div>
            
            <Link 
              href={`/blog/${post.slug}`}
              className="inline-flex items-center text-[#78f3d3] font-medium hover:text-[#4de0c0] transition-colors group"
            >
              Leer artículo completo
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className={`${baseClasses} flex`}>
        <Link href={`/blog/${post.slug}`} className="w-24 h-24 flex-shrink-0">
          <div 
            className="w-full h-full bg-cover bg-center rounded-l-xl"
            style={{ backgroundImage: `url(${post.image})` }}
          ></div>
        </Link>
        
        <div className="p-4 flex-1">
          <div className="text-xs text-[#6c7a89] mb-1">
            {formatDate(post.date)} • {post.readTime}
          </div>
          
          <Link href={`/blog/${post.slug}`}>
            <h4 className="font-semibold text-[#313D52] text-sm hover:text-[#78f3d3] transition-colors cursor-pointer line-clamp-2">
              {post.title}
            </h4>
          </Link>
        </div>
      </article>
    );
  }

  // Default variant
  return (
    <article className={baseClasses}>
      <Link href={`/blog/${post.slug}`}>
        <div className="relative overflow-hidden">
          <div 
            className="h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
            style={{ backgroundImage: `url(${post.image})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
            {post.featured && (
              <div className="absolute top-4 left-4">
                <span className="bg-[#78f3d3] text-[#313D52] px-3 py-1 rounded-full text-xs font-semibold">
                  Destacado
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
      
      <div className="p-6">
        <div className="flex items-center justify-between text-sm text-[#6c7a89] mb-3">
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            <span>{formatDate(post.date)}</span>
          </div>
          <div className="flex items-center">
            <Clock size={14} className="mr-1" />
            <span>{post.readTime}</span>
          </div>
        </div>
        
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-xl font-semibold text-[#313D52] mb-3 hover:text-[#78f3d3] transition-colors cursor-pointer">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-[#6c7a89] mb-4 line-clamp-3">{post.excerpt}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="bg-[#f5f9f8] text-[#313D52] px-2 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-[#6c7a89]">
            <User size={14} className="mr-1" />
            <span>{post.author}</span>
          </div>
          
          <Link 
            href={`/blog/${post.slug}`}
            className="inline-flex items-center text-[#78f3d3] font-medium hover:text-[#4de0c0] transition-colors group"
          >
            Leer más 
            <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;