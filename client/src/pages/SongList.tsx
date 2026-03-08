import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Music, Loader2, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Link, useLocation } from "wouter";

type SortField = "code" | "title" | "artist";
type SortDirection = "asc" | "desc";

export default function SongList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const pageSize = 10;
  const skeletonRows = useMemo(
    () => Array.from({ length: pageSize }, (_, rowNumber) => `song-loading-row-${rowNumber + 1}`),
    [pageSize]
  );

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
  const {
    data: songs = [],
    isLoading: isLoadingSongs,
    isFetching: isFetchingSongs,
    isError: isSongsError,
    error: songsError,
    refetch: refetchSongs,
  } = trpc.songs.list.useQuery();

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
  const isRefreshing = isFetchingSongs && !isLoadingSongs;
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

  const navigateToSong = (songId: number) => {
    setLocation(`/player/${songId}`);
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

  const getSongsErrorMessage = () => {
    if (!songsError) {
      return "Nao foi possivel carregar as musicas no momento.";
    }

    return songsError.message || "Nao foi possivel carregar as musicas no momento.";
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

            {isRefreshing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando lista de musicas...
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {isSongsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Erro ao carregar musicas</AlertTitle>
            <AlertDescription>
              <p>{getSongsErrorMessage()}</p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => refetchSongs()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && !songs.length && (
          <Card className="vivioke-surface overflow-hidden p-0" aria-busy="true" aria-live="polite">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[110px]" />
                  <col />
                  <col />
                </colgroup>
                <thead className="bg-primary/14 text-sm font-bold text-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">Codigo</th>
                    <th scope="col" className="px-4 py-3 text-left">Musica</th>
                    <th scope="col" className="px-4 py-3 text-left">Artista</th>
                  </tr>
                </thead>
                <tbody>
                  {skeletonRows.map((rowId) => (
                    <tr key={rowId} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Songs List */}
        {!isLoading && filteredSongs.length > 0 && (
          <Card className="vivioke-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[110px]" />
                  <col />
                  <col />
                </colgroup>
                <thead className="bg-primary/14 text-sm font-bold text-foreground">
                  <tr>
                    <th scope="col" aria-sort={getAriaSort("code")} className="px-4 py-3 text-left">
                      <button type="button" className={getSortHeaderClassName("code")} onClick={() => handleSortChange("code")}>
                        <span>Código</span>
                        {renderSortIcon("code")}
                      </button>
                    </th>
                    <th scope="col" aria-sort={getAriaSort("title")} className="px-4 py-3 text-left">
                      <button type="button" className={getSortHeaderClassName("title")} onClick={() => handleSortChange("title")}>
                        <span>Música</span>
                        {renderSortIcon("title")}
                      </button>
                    </th>
                    <th scope="col" aria-sort={getAriaSort("artist")} className="px-4 py-3 text-left">
                      <button type="button" className={getSortHeaderClassName("artist")} onClick={() => handleSortChange("artist")}>
                        <span>Artista</span>
                        {renderSortIcon("artist")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSongs.map((song) => (
                    <tr
                      key={song.id}
                      tabIndex={0}
                      className="cursor-pointer border-t border-border transition-colors hover:bg-accent/25 focus-visible:bg-accent/25 focus-visible:outline-none"
                      onClick={() => navigateToSong(song.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigateToSong(song.id);
                        }
                      }}
                      aria-label={`Abrir musica ${song.title} de ${song.artist}`}
                    >
                      <td className="px-4 py-3 font-mono text-sm text-primary">
                        {extractSongNumber(song.instrumentalUrl, song.id)}
                      </td>
                      <td className="px-4 py-3 text-foreground truncate">{song.title}</td>
                      <td className="px-4 py-3 text-foreground truncate">{song.artist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
