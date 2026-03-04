import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Music, Loader2, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "wouter";

type SortField = "code" | "title" | "artist";
type SortDirection = "asc" | "desc";

export default function SongList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const pageSize = 10;

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .split("")
      .filter((char) => {
        const codePoint = char.codePointAt(0) ?? 0;
        return codePoint < 0x0300 || codePoint > 0x036f;
      })
      .join("")
      .toLowerCase()
      .trim();

  const extractSongNumber = (url?: string | null, fallbackId?: number) => {
    if (!url) return String(fallbackId ?? "-");
    const normalizedUrl = url.split("?")[0];
    const pattern = /\/(\d+)\.mp4$/i;
    const match = pattern.exec(normalizedUrl);
    if (match) return match[1];
    return String(fallbackId ?? "-");
  };

  // Fetch all songs
  const { data: songs = [], isLoading: isLoadingSongs } = trpc.songs.list.useQuery();

  // Filter and sort results
  const filteredSongs = useMemo(() => {
    let results = songs;

    if (searchQuery.trim().length > 0) {
      const normalizedQuery = normalizeText(searchQuery);
      results = results.filter((song) => {
        const title = normalizeText(song.title);
        const artist = normalizeText(song.artist);
        const number = normalizeText(extractSongNumber(song.instrumentalUrl, song.id));
        return (
          title.includes(normalizedQuery) ||
          artist.includes(normalizedQuery) ||
          number.includes(normalizedQuery)
        );
      });
    }

    return [...results].sort((a, b) => {
      const directionMultiplier = sortDirection === "asc" ? 1 : -1;

      if (sortField === "code") {
        const aCode = extractSongNumber(a.instrumentalUrl, a.id);
        const bCode = extractSongNumber(b.instrumentalUrl, b.id);
        return aCode.localeCompare(bCode, undefined, { numeric: true }) * directionMultiplier;
      }

      if (sortField === "title") {
        const aTitle = normalizeText(a.title);
        const bTitle = normalizeText(b.title);
        return aTitle.localeCompare(bTitle) * directionMultiplier;
      }

      const aArtist = normalizeText(a.artist);
      const bArtist = normalizeText(b.artist);
      return aArtist.localeCompare(bArtist) * directionMultiplier;
    });
  }, [songs, searchQuery, sortField, sortDirection]);

  const paginatedSongs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSongs.slice(startIndex, startIndex + pageSize);
  }, [filteredSongs, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSongs.length / pageSize));

  const isLoading = isLoadingSongs;
  const hasNoSongs = songs.length === 0;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
    }

    if (sortDirection === "asc") {
      return <ArrowUp className="w-3.5 h-3.5 text-primary" />;
    }

    return <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  const getSortHeaderClassName = (field: SortField) => {
    const baseClass = "flex items-center gap-1 text-left rounded-md px-2 py-1 transition-colors";
    if (sortField === field) {
      return `${baseClass} bg-primary/12 text-primary`;
    }

    return `${baseClass} text-foreground/90 hover:bg-primary/8`;
  };

  const getAriaSort = (field: SortField): "none" | "ascending" | "descending" => {
    if (sortField !== field) {
      return "none";
    }

    return sortDirection === "asc" ? "ascending" : "descending";
  };

  return (
    <div className="min-h-screen vivioke-party-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-black vivioke-title-gradient mb-2">
            Escolha uma Música
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Selecione a música que deseja cantar
          </p>
        </div>

        {/* Search and Filters */}
        <div className="vivioke-surface rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, música ou artista..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 py-2 text-base rounded-lg border-input focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
          </div>
        )}

        {/* Songs List */}
        {!isLoading && filteredSongs.length > 0 && (
          <Card className="vivioke-surface overflow-hidden">
            <div className="grid grid-cols-[110px_1fr_1fr] gap-4 px-4 py-3 bg-primary/14 text-sm font-bold text-foreground">
              <button
                type="button"
                className={getSortHeaderClassName("code")}
                onClick={() => handleSortChange("code")}
                aria-sort={getAriaSort("code")}
              >
                <span>Código</span>
                {renderSortIcon("code")}
              </button>
              <button
                type="button"
                className={getSortHeaderClassName("title")}
                onClick={() => handleSortChange("title")}
                aria-sort={getAriaSort("title")}
              >
                <span>Música</span>
                {renderSortIcon("title")}
              </button>
              <button
                type="button"
                className={getSortHeaderClassName("artist")}
                onClick={() => handleSortChange("artist")}
                aria-sort={getAriaSort("artist")}
              >
                <span>Artista</span>
                {renderSortIcon("artist")}
              </button>
            </div>

            <div className="divide-y divide-border">
              {paginatedSongs.map((song) => (
                <Link key={song.id} href={`/player/${song.id}`}>
                  <div className="grid grid-cols-[110px_1fr_1fr] gap-4 px-4 py-3 items-center hover:bg-accent/25 transition-colors cursor-pointer">
                    <span className="font-mono text-sm text-primary">
                      {extractSongNumber(song.instrumentalUrl, song.id)}
                    </span>
                    <span className="text-foreground truncate">{song.title}</span>
                    <span className="text-foreground truncate">{song.artist}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                  Próxima
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && filteredSongs.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
              {hasNoSongs ? "Nenhuma música cadastrada" : "Nenhuma música encontrada"}
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {hasNoSongs
                ? "Nenhuma música válida encontrada em media/BD.ini com arquivo .mp4 correspondente na pasta media"
                : "Tente ajustar seus filtros ou termo de busca"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
