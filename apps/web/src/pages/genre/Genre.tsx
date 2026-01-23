import { motion } from 'framer-motion';

const GENRES = [
  'Pop',
  'Hip-Hop',
  'Rock',
  'Alternative',
  'Indie',
  'Electronic',
  'Dance',
  'R&B',
  'Jazz',
  'Blues',
  'Country',
  'Folk',
  'Latin',
  'Lo-Fi',
  'House',
  'Techno',
];

const GENRE_IMAGES: Record<string, string> = {
  Pop: "https://images.unsplash.com/photo-1512830414785-9928e23475dc?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Hip-Hop": "https://images.unsplash.com/photo-1601643157091-ce5c665179ab?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  Rock: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
  Alternative: "https://plus.unsplash.com/premium_photo-1739485104667-77ffcc398a81?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",  
  Indie: "https://images.unsplash.com/photo-1481886756534-97af88ccb438?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  Electronic: "https://images.unsplash.com/photo-1616709676522-9861033271a2?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  Dance: "https://images.unsplash.com/photo-1588540111535-2b7ef1eb7833?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "R&B": "https://images.unsplash.com/photo-1535146851324-6571dc3f2672?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",  
  Jazz: "https://images.unsplash.com/flagged/photo-1569231290377-072234d3ee57?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
  Blues: "https://images.unsplash.com/photo-1543372742-312f414ace57?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  Country: "https://images.unsplash.com/photo-1507404684477-09c7f690976a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
  Folk: "https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?q=80&w=1077&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  Latin: "https://images.unsplash.com/photo-1634137622977-34ef2eda193f?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
  "Lo-Fi": "https://images.unsplash.com/photo-1558843196-6a1ed3250d80?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
  House: "https://images.unsplash.com/photo-1615743893538-c502749d04a0?q=80&w=733&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
  Techno: "https://images.unsplash.com/photo-1578736641330-3155e606cd40?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

const Genre = () => {
  const handleSelectGenre = (genre: string) => {
    console.log('Selected genre:', genre);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral text-neutral-contrast min-h-screen p-4"
    >
      <div
        className="
          w-full
          grid
          gap-3 sm:gap-4 md:gap-5
          grid-cols-1
          md:grid-cols-3
          lg:grid-cols-6
        "
      >
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => handleSelectGenre(genre)}
            style={{
              backgroundImage: `url(${GENRE_IMAGES[genre]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            className="
              relative
              w-full
              aspect-square
              border border-neutral-contrast
              rounded
              overflow-hidden
              flex items-center justify-center
              text-white text-sm sm:text-base
              transition-all
              hover:border-primary
              hover:text-primary
              hover:brightness-110
              cursor-pointer
            "
          >
            <div className="absolute inset-0 bg-neutral/65 hover:bg-neutral/85 transition-all"></div>
            <span className="relative text-3xl font-bold z-10">{genre}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default Genre;
