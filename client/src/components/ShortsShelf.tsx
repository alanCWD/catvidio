import { Video } from "@/lib/mock-data";
import { Link } from "wouter";
import { Play } from "lucide-react";
import funnyCat from "@assets/stock_images/funny_cat_vertical_v_3b358a6e.jpg";
import cuteKitten from "@assets/stock_images/cute_kitten_vertical_c88abb22.jpg";
import catJumping from "@assets/stock_images/cat_jumping_vertical_f26c7765.jpg";
import grumpyCat from "@assets/stock_images/grumpy_cat_vertical__486b45fa.jpg";

interface ShortsShelfProps {
  shorts: Video[];
}

const thumbnails = [funnyCat, cuteKitten, catJumping, grumpyCat];

export function ShortsShelf({ shorts }: ShortsShelfProps) {
  return (
    <div className="py-2 border-t border-b border-border/40 mb-2">
      <div className="px-4 py-2 flex items-center gap-2">
        <div className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-red-600" focusable="false"><g><path d="M17.77,10.32l-1.2-.5L18,9.06a3.74,3.74,0,0,0-3.5-6.62L6,6.94a3.74,3.74,0,0,0,.36,6.77l1.2.5L6.04,15a3.74,3.74,0,0,0,3.5,6.62l8.5-4.5a3.74,3.74,0,0,0-.36-6.77ZM9.54,19.38a1.74,1.74,0,0,1-2.34-1l.82-3L9.54,19.38Zm6.46-5.87-1.52,4.86L13,17.21l1.52-4.86ZM16.32,5.22,14.8,10.08l-1.52-4.86,1.52-4.86A1.74,1.74,0,0,1,16.32,5.22Z"></path><polygon points="10 15 15 12 10 9 10 15"></polygon></g></svg>
        </div>
        <h2 className="font-bold text-lg">Shorts</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-2 px-2 pb-4">
        {shorts.slice(0, 4).map((short, idx) => (
          <Link key={short.id} href={`/shorts/${short.id}`}>
            <a className="block group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted">
              <img 
                src={thumbnails[idx % thumbnails.length]} 
                alt={short.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 flex flex-col justify-end">
                <h3 className="text-white text-sm font-medium line-clamp-2 leading-tight drop-shadow-md mb-1">
                  {short.title}
                </h3>
                <span className="text-white/90 text-[10px] drop-shadow-md">{short.views}</span>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
