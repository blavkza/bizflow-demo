"use client";

import type React from "react";
import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  MoreVertical,
  Plus,
  Search,
  Grid,
  List,
  Download,
  Trash2,
  Edit3,
  FolderOpen,
  Calendar,
  Star,
  Share2,
  Filter,
  SortAsc,
  Eye,
  Tag,
  Clock,
  Users,
  Bookmark,
  Check,
  Zap,
  ArrowLeft,
  Share,
  Edit,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  lastModified: Date;
  thumbnail?: string;
  tags: string[];
  starred: boolean;
  shared: boolean;
  uploadProgress?: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  pinned: boolean;
  color: string;
}

interface FolderStats {
  totalFiles: number;
  totalSize: number;
  recentActivity: number;
  sharedFiles: number;
}

interface AdvancedFolderPageProps {
  folderId: string;
}

export default function FolderPage({ folderId }: AdvancedFolderPageProps) {
  const router = useRouter();

  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "1",
      name: "Project Proposal Q1 2024.pdf",
      type: "application/pdf",
      size: 2048000,
      uploadedAt: new Date("2024-01-15"),
      lastModified: new Date("2024-01-16"),
      tags: ["important", "proposal"],
      starred: true,
      shared: false,
    },
    {
      id: "2",
      name: "Design System Mockup.figma",
      type: "application/figma",
      size: 1024000,
      uploadedAt: new Date("2024-01-16"),
      lastModified: new Date("2024-01-17"),
      tags: ["design", "ui"],
      starred: false,
      shared: true,
    },
    {
      id: "3",
      name: "Team Meeting Recording.mp4",
      type: "video/mp4",
      size: 15728640,
      uploadedAt: new Date("2024-01-17"),
      lastModified: new Date("2024-01-17"),
      tags: ["meeting", "video"],
      starred: false,
      shared: false,
    },
  ]);

  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Project Kickoff Notes",
      content:
        "Key objectives for Q1:\n• Complete design system\n• Finalize technical architecture\n• Set up development environment\n• Plan sprint cycles",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      tags: ["planning", "kickoff"],
      pinned: true,
      color: "blue",
    },
    {
      id: "2",
      title: "Design Feedback",
      content:
        "Stakeholder feedback from design review:\n• Adjust color palette for better accessibility\n• Simplify navigation structure\n• Add more white space in mobile layouts",
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-17"),
      tags: ["design", "feedback"],
      pinned: false,
      color: "green",
    },
  ]);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<FileItem[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">(
    "date"
  );
  const [filterBy, setFilterBy] = useState<
    "all" | "starred" | "shared" | "recent"
  >("all");
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    tags: "",
    color: "blue",
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "edit">(
    "view"
  );
  const [shareExpiry, setShareExpiry] = useState<
    "never" | "7days" | "30days" | "custom"
  >("never");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [collaborators, setCollaborators] = useState([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "editor",
      avatar: "JD",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "viewer",
      avatar: "JS",
    },
  ]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");

  const folderName = "Q1 Project Hub";
  const folderDescription =
    "Centralized workspace for Q1 project deliverables and collaboration";

  const folderStats: FolderStats = {
    totalFiles: files.length,
    totalSize: files.reduce((acc, file) => acc + file.size, 0),
    recentActivity: files.filter(
      (file) =>
        new Date().getTime() - file.lastModified.getTime() <
        7 * 24 * 60 * 60 * 1000
    ).length,
    sharedFiles: files.filter((file) => file.shared).length,
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    uploadFiles(droppedFiles);
  }, []);

  const uploadFiles = (filesToUpload: File[]) => {
    filesToUpload.forEach((file, index) => {
      const newFile: FileItem = {
        id: Date.now().toString() + index,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        lastModified: new Date(),
        tags: [],
        starred: false,
        shared: false,
        uploadProgress: 0,
      };

      setUploadingFiles((prev) => [...prev, newFile]);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? {
                  ...f,
                  uploadProgress: Math.min((f.uploadProgress || 0) + 10, 100),
                }
              : f
          )
        );
      }, 200);

      // Complete upload after simulation
      setTimeout(() => {
        clearInterval(interval);
        setUploadingFiles((prev) => prev.filter((f) => f.id !== newFile.id));
        setFiles((prev) => [
          ...prev,
          { ...newFile, uploadProgress: undefined },
        ]);
      }, 2000);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    uploadFiles(uploadedFiles);
    setShowUploadDialog(false);
  };

  const getFileIcon = (type: string, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-12 w-12",
    };

    if (type.startsWith("image/"))
      return <ImageIcon className={`${sizeClasses[size]} text-blue-500`} />;
    if (type.startsWith("video/"))
      return <Video className={`${sizeClasses[size]} text-purple-500`} />;
    if (type.startsWith("audio/"))
      return <Music className={`${sizeClasses[size]} text-green-500`} />;
    if (type.includes("pdf"))
      return <FileText className={`${sizeClasses[size]} text-red-500`} />;
    if (type.includes("figma"))
      return (
        <div
          className={`${sizeClasses[size]} bg-purple-500 rounded text-white flex items-center justify-center text-xs font-bold`}
        >
          F
        </div>
      );
    if (type.includes("zip") || type.includes("rar"))
      return <Archive className={`${sizeClasses[size]} text-yellow-500`} />;
    return <FileText className={`${sizeClasses[size]} text-gray-500`} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const formatTotalSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getFilteredAndSortedFiles = () => {
    const filtered = files.filter((file) => {
      const matchesSearch =
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      switch (filterBy) {
        case "starred":
          return matchesSearch && file.starred;
        case "shared":
          return matchesSearch && file.shared;
        case "recent":
          return (
            matchesSearch &&
            new Date().getTime() - file.lastModified.getTime() <
              7 * 24 * 60 * 60 * 1000
          );
        default:
          return matchesSearch;
      }
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "size":
          return b.size - a.size;
        case "type":
          return a.type.localeCompare(b.type);
        case "date":
        default:
          return b.lastModified.getTime() - a.lastModified.getTime();
      }
    });
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const toggleFileStar = (fileId: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, starred: !file.starred } : file
      )
    );
  };

  const deleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
    setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
  };

  const deleteSelectedFiles = () => {
    setFiles((prev) => prev.filter((file) => !selectedFiles.includes(file.id)));
    setSelectedFiles([]);
  };

  const addNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        createdAt: new Date(),
        updatedAt: new Date(),
        pinned: false,
        color: newNote.color,
      };
      setNotes((prev) => [...prev, note]);
      setNewNote({ title: "", content: "", tags: "", color: "blue" });
    }
  };

  const updateNote = (updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === updatedNote.id
          ? { ...updatedNote, updatedAt: new Date() }
          : note
      )
    );
    setEditingNote(null);
  };

  const toggleNotePinned = (noteId: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, pinned: !note.pinned } : note
      )
    );
  };

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const linkId = Math.random().toString(36).substring(2, 15);
    const link = `${baseUrl}/shared/${folderId}/${linkId}`;
    setShareLink(link);
  };

  const copyShareLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      // You could add a toast notification here
    }
  };

  const downloadAllFiles = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          // In a real app, this would trigger the actual download
          const link = document.createElement("a");
          link.href = "#"; // This would be the actual zip file URL
          link.download = `${folderName.replace(/\s+/g, "_")}_files.zip`;
          link.click();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const addCollaborator = () => {
    if (
      newCollaboratorEmail.trim() &&
      !collaborators.find((c) => c.email === newCollaboratorEmail)
    ) {
      const newCollaborator = {
        id: Date.now().toString(),
        name: newCollaboratorEmail.split("@")[0],
        email: newCollaboratorEmail,
        role: "viewer" as const,
        avatar: newCollaboratorEmail.substring(0, 2).toUpperCase(),
      };
      setCollaborators((prev) => [...prev, newCollaborator]);
      setNewCollaboratorEmail("");
    }
  };

  const removeCollaborator = (collaboratorId: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
  };

  const updateCollaboratorRole = (
    collaboratorId: string,
    newRole: "viewer" | "editor"
  ) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.id === collaboratorId ? { ...c, role: newRole } : c))
    );
  };

  const filteredFiles = getFilteredAndSortedFiles();
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const noteColors = {
    blue: "bg-blue-500 border-blue-200",
    green: "bg-green-500 border-green-200",
    yellow: "bg-yellow-500 border-yellow-200",
    purple: "bg-purple-500 border-purple-200",
    pink: "bg-pink-500 border-pink-200",
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{folderName}</h1>
          <p className="text-muted-foreground mt-1">{folderDescription}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <Tabs defaultValue="files" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <TabsList className="grid w-full sm:w-auto grid-cols-2">
                  <TabsTrigger
                    value="files"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Files ({files.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Notes ({notes.length})
                  </TabsTrigger>
                </TabsList>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Dialog
                    open={showUploadDialog}
                    onOpenChange={setShowUploadDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant={"outline"}>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Files</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                            isDragOver
                              ? "border-blue-500 bg-blue-50 scale-105"
                              : "border-gray-300"
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium  mb-2">
                            Drop files here
                          </h3>
                          <p className=" mb-4">or click to browse</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button onClick={() => fileInputRef.current?.click()}>
                            Choose Files
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <TabsContent value="files" className="space-y-6">
                {/* Enhanced Upload Area */}
                <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors duration-200">
                  <CardContent className="p-8">
                    <div
                      className={`text-center transition-all duration-200 ${isDragOver ? "scale-105" : ""}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="relative inline-block mb-4">
                        <div className="absolute inset-0  rounded-full blur opacity-20"></div>
                        <div className="relative bg-muted-foreground p-4 rounded-full">
                          <Upload className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        Drag & Drop Files
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Support for images, documents, videos, and more
                      </p>
                      <Button
                        size="lg"
                        variant={"outline"}
                        onClick={() => setShowUploadDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Upload Progress */}
                {uploadingFiles.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        Uploading Files
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {uploadingFiles.map((file) => (
                        <div key={file.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate">
                              {file.name}
                            </span>
                            <span className="text-gray-500">
                              {file.uploadProgress}%
                            </span>
                          </div>
                          <Progress
                            value={file.uploadProgress}
                            className="h-2"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Download Progress */}
                {isDownloading && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <Download className="h-5 w-5" />
                        Preparing Download
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            Compressing {files.length} files...
                          </span>
                          <span className="text-green-600">
                            {downloadProgress}%
                          </span>
                        </div>
                        <Progress value={downloadProgress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                    <Input
                      placeholder="Search files and tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 backdrop-blur-sm border-white/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={sortBy}
                      onValueChange={(value: any) => setSortBy(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SortAsc className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="size">Size</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filterBy}
                      onValueChange={(value: any) => setFilterBy(value)}
                    >
                      <SelectTrigger className="w-32">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Files</SelectItem>
                        <SelectItem value="starred">Starred</SelectItem>
                        <SelectItem value="shared">Shared</SelectItem>
                        <SelectItem value="recent">Recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedFiles.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          {selectedFiles.length} file
                          {selectedFiles.length > 1 ? "s" : ""} selected
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={deleteSelectedFiles}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Files Display */}
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFiles.map((file) => (
                      <Card
                        key={file.id}
                        className="group hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 hover:-translate-y-1 "
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedFiles.includes(file.id)}
                                onCheckedChange={() =>
                                  toggleFileSelection(file.id)
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                              {getFileIcon(file.type, "lg")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleFileStar(file.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Star
                                  className={`h-4 w-4 ${file.starred ? "fill-yellow-400 text-yellow-400" : ""}`}
                                />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => deleteFile(file.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <h3
                            className="font-semibold text-sm mb-3 truncate group-hover:text-blue-600 transition-colors"
                            title={file.name}
                          >
                            {file.name}
                          </h3>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{formatFileSize(file.size)}</span>
                              <span>
                                {file.lastModified.toLocaleDateString()}
                              </span>
                            </div>

                            {file.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {file.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {file.tags.length > 2 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs px-2 py-0.5"
                                  >
                                    +{file.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {file.shared && (
                                <Badge variant="outline" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  Shared
                                </Badge>
                              )}
                              {file.starred && (
                                <Badge variant="outline" className="text-xs">
                                  <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                  Starred
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y divide-gray-100">
                        {filteredFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-6 hover:bg-gray-30/50 dark:hover:bg-gray-70 transition-colors group"
                          >
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <Checkbox
                                checked={selectedFiles.includes(file.id)}
                                onCheckedChange={() =>
                                  toggleFileSelection(file.id)
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                              {getFileIcon(file.type)}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors">
                                  {file.name}
                                </h3>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {file.lastModified.toLocaleDateString()}
                                  </span>
                                  {file.tags.length > 0 && (
                                    <div className="flex gap-1">
                                      {file.tags.slice(0, 2).map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {file.starred && (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              )}
                              {file.shared && (
                                <Users className="h-4 w-4 text-blue-500" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleFileStar(file.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Star
                                  className={`h-4 w-4 ${file.starred ? "fill-yellow-400 text-yellow-400" : ""}`}
                                />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => deleteFile(file.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-6">
                {/* Enhanced Add Note */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-600" />
                      Create New Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="note-title">Title</Label>
                        <Input
                          id="note-title"
                          placeholder="Enter note title..."
                          value={newNote.title}
                          onChange={(e) =>
                            setNewNote((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="note-tags">
                          Tags (comma separated)
                        </Label>
                        <Input
                          id="note-tags"
                          placeholder="planning, important, review..."
                          value={newNote.tags}
                          onChange={(e) =>
                            setNewNote((prev) => ({
                              ...prev,
                              tags: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="note-content">Content</Label>
                      <Textarea
                        id="note-content"
                        placeholder="Enter note content..."
                        rows={4}
                        value={newNote.content}
                        onChange={(e) =>
                          setNewNote((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label>Color:</Label>
                        <div className="flex gap-2">
                          {Object.keys(noteColors).map((color) => (
                            <button
                              key={color}
                              onClick={() =>
                                setNewNote((prev) => ({ ...prev, color }))
                              }
                              className={`w-6 h-6 rounded-full border-2 ${
                                newNote.color === color
                                  ? "border-gray-400"
                                  : "border-gray-200"
                              } ${noteColors[color as keyof typeof noteColors].split(" ")[0]}`}
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={addNote}
                        disabled={
                          !newNote.title.trim() || !newNote.content.trim()
                        }
                        variant={"outline"}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Notes Display */}
                <div className="grid gap-6">
                  {sortedNotes.map((note) => (
                    <Card
                      key={note.id}
                      className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${noteColors[note.color as keyof typeof noteColors]} border-2`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {note.pinned && (
                                <Bookmark className="h-4 w-4 text-blue-600 fill-blue-600" />
                              )}
                              <CardTitle className="text-lg">
                                {note.title}
                              </CardTitle>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Created {note.createdAt.toLocaleDateString()}
                                </span>
                              </div>
                              {note.updatedAt > note.createdAt && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Updated{" "}
                                    {note.updatedAt.toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => toggleNotePinned(note.id)}
                              >
                                <Bookmark className="h-4 w-4 mr-2" />
                                {note.pinned ? "Unpin" : "Pin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setEditingNote(note)}
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteNote(note.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap mb-4">
                          {note.content}
                        </p>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {note.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Edit Note Dialog */}
                <Dialog
                  open={!!editingNote}
                  onOpenChange={() => setEditingNote(null)}
                >
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Note</DialogTitle>
                    </DialogHeader>
                    {editingNote && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-title">Title</Label>
                          <Input
                            id="edit-title"
                            value={editingNote.title}
                            onChange={(e) =>
                              setEditingNote((prev) =>
                                prev ? { ...prev, title: e.target.value } : null
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-tags">
                            Tags (comma separated)
                          </Label>
                          <Input
                            id="edit-tags"
                            value={editingNote.tags.join(", ")}
                            onChange={(e) =>
                              setEditingNote((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      tags: e.target.value
                                        .split(",")
                                        .map((tag) => tag.trim())
                                        .filter(Boolean),
                                    }
                                  : null
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-content">Content</Label>
                          <Textarea
                            id="edit-content"
                            rows={8}
                            value={editingNote.content}
                            onChange={(e) =>
                              setEditingNote((prev) =>
                                prev
                                  ? { ...prev, content: e.target.value }
                                  : null
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label>Color:</Label>
                            <div className="flex gap-2">
                              {Object.keys(noteColors).map((color) => (
                                <button
                                  key={color}
                                  onClick={() =>
                                    setEditingNote((prev) =>
                                      prev ? { ...prev, color } : null
                                    )
                                  }
                                  className={`w-6 h-6 rounded-full border-2 ${
                                    editingNote.color === color
                                      ? "border-gray-400"
                                      : "border-gray-200"
                                  } ${noteColors[color as keyof typeof noteColors].split(" ")[0]}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingNote(null)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={() => updateNote(editingNote)}>
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>
            </Tabs>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Folder Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Folder Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {folderStats.totalFiles}
                    </div>
                    <div className="text-xs text-gray-500">Total Files</div>
                  </div>
                  <div className="text-center p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatTotalSize(folderStats.totalSize)}
                    </div>
                    <div className="text-xs text-gray-500">Storage Used</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Recent Activity</span>
                    <Badge variant="secondary">
                      {folderStats.recentActivity}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Shared Files</span>
                    <Badge variant="secondary">{folderStats.sharedFiles}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Notes</span>
                    <Badge variant="secondary">{notes.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog
                  open={showShareDialog}
                  onOpenChange={setShowShareDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent hover:bg-blue-50"
                      onClick={generateShareLink}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Folder
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Share Link</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={shareLink}
                            readOnly
                            className="bg-gray-50"
                          />
                          <Button size="sm" onClick={copyShareLink}>
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Permission Level</Label>
                        <Select
                          value={sharePermission}
                          onValueChange={(value: any) =>
                            setSharePermission(value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View Only</SelectItem>
                            <SelectItem value="edit">Can Edit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Link Expiry</Label>
                        <Select
                          value={shareExpiry}
                          onValueChange={(value: any) => setShareExpiry(value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">Never Expires</SelectItem>
                            <SelectItem value="7days">7 Days</SelectItem>
                            <SelectItem value="30days">30 Days</SelectItem>
                            <SelectItem value="custom">Custom Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowShareDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => setShowShareDialog(false)}>
                          Create Link
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent hover:bg-green-50"
                  onClick={downloadAllFiles}
                  disabled={isDownloading || files.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading
                    ? `Downloading... ${downloadProgress}%`
                    : "Download All"}
                </Button>

                <Dialog
                  open={showAccessDialog}
                  onOpenChange={setShowAccessDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent hover:bg-purple-50"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Access
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Manage Folder Access</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Add Collaborator */}
                      <div className="space-y-2">
                        <Label>Add Collaborator</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter email address..."
                            value={newCollaboratorEmail}
                            onChange={(e) =>
                              setNewCollaboratorEmail(e.target.value)
                            }
                            onKeyPress={(e) =>
                              e.key === "Enter" && addCollaborator()
                            }
                          />
                          <Button
                            onClick={addCollaborator}
                            disabled={!newCollaboratorEmail.trim()}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Current Collaborators */}
                      <div className="space-y-3">
                        <Label>
                          Current Access ({collaborators.length} people)
                        </Label>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {collaborators.map((collaborator) => (
                            <div
                              key={collaborator.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                  {collaborator.avatar}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {collaborator.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {collaborator.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={collaborator.role}
                                  onValueChange={(value: any) =>
                                    updateCollaboratorRole(
                                      collaborator.id,
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-24 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="viewer">
                                      Viewer
                                    </SelectItem>
                                    <SelectItem value="editor">
                                      Editor
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeCollaborator(collaborator.id)
                                  }
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAccessDialog(false)}
                        >
                          Close
                        </Button>
                        <Button onClick={() => setShowAccessDialog(false)}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Design System Mockup.figma</p>
                      <p className="text-gray-500 text-xs">
                        Uploaded 2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Project Kickoff Notes</p>
                      <p className="text-gray-500 text-xs">Updated 1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Team Meeting Recording.mp4</p>
                      <p className="text-gray-500 text-xs">Shared 2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
