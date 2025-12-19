import { Video } from "@/lib/mock-data";
import { Link } from "wouter";
import { ZoomiesLogo } from "@/components/Branding";

interface ShortsShelfProps {
  shorts: Video[];
}

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
        {shorts.slice(0, 4).map((short) => (
          <Link key={short.id} href={`/shorts/${short.id}`} className="block group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted">
            <img 
              src={short.thumbnail} 
              alt={short.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 flex flex-col justify-end">
              <div className="flex items-center gap-1.5 mb-1">
                {(() => {
                  const authorName = typeof short.author === 'object' ? short.author.username : short.author;
                  const avatarColor = typeof short.author === 'object' ? short.author.avatarColor : '#FF0055';
                  const avatar = typeof short.author === 'object' ? short.author.avatar : null;
                  
                  return (
                    <div 
                      className="w-5 h-5 rounded-full overflow-hidden border flex-shrink-0"
                      style={{ borderColor: avatarColor || '#FF0055' }}
                    >
                      {avatar ? (
                        <img src={avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName || 'default'}`} 
                          alt="" 
                          className="w-full h-full object-cover bg-secondary"
                        />
                      )}
                    </div>
                  );
                })()}
              </div>
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
