import { Video } from "@/lib/mock-data";
import { Link } from "wouter";
import { ZoomiesLogo } from "@/components/Branding";
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
        <div className="text-red-600">
           <ZoomiesLogo className="w-6 h-6" active={true} />
        </div>
        <h2 className="font-bold text-lg">Zoomies</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-2 px-2 pb-4">
        {shorts.slice(0, 4).map((short, idx) => (
          <Link key={short.id} href={`/shorts/${short.id}`} className="block group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted">
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
          </Link>
        ))}
      </div>
    </div>
  );
}
