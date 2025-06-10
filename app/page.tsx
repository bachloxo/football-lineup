"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shuffle, Edit3, Upload, X, Move, Camera } from "lucide-react"
import DataStatus from "@/components/data-status"
import html2canvas from "html2canvas"

type SkillLevel = "good" | "average" | "weak"

interface Player {
  name: string
  skill: SkillLevel
  avatar?: string
  position?: { x: number; y: number }
}

interface Team {
  name: string
  players: Player[]
  totalSkill: number
}

const skillValues = {
  good: 3,
  average: 2,
  weak: 1,
}

const skillLabels = {
  good: "Tốt",
  average: "Trung bình",
  weak: "Yếu",
}

// Thêm sau các constant definitions, trước component function
const STORAGE_KEY = "football-lineup-data"

// Default positions for 2-3-1 formation
const defaultPositions = {
  team1: [
    { x: 80, y: 300 }, // GK
    { x: 160, y: 200 }, // Defender 1
    { x: 160, y: 400 }, // Defender 2
    { x: 280, y: 150 }, // Midfielder 1
    { x: 280, y: 300 }, // Midfielder 2
    { x: 280, y: 450 }, // Midfielder 3
    { x: 400, y: 300 }, // Forward
  ],
  team2: [
    { x: 720, y: 300 }, // GK
    { x: 640, y: 200 }, // Defender 1
    { x: 640, y: 400 }, // Defender 2
    { x: 520, y: 150 }, // Midfielder 1
    { x: 520, y: 300 }, // Midfielder 2
    { x: 520, y: 450 }, // Midfielder 3
    { x: 400, y: 300 }, // Forward
  ],
}

export default function FootballLineup() {
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 14 }, (_, i) => ({ name: "", skill: "average" as SkillLevel })),
  )
  const [teams, setTeams] = useState<Team[]>([])
  const [showLineup, setShowLineup] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<{ teamIndex: number; playerIndex: number } | null>(null)
  const [draggedPlayer, setDraggedPlayer] = useState<{ teamIndex: number; playerIndex: number } | null>(null)
  const [exportingImage, setExportingImage] = useState(false)
  const fieldRef = useRef<HTMLDivElement>(null)
  const [teamNames, setTeamNames] = useState({ team1: "Đội Xanh", team2: "Đội Đỏ" })

  // Thêm các functions này vào trong component, sau các state declarations:

  const saveToLocalStorage = (data: Player[]) => {
    try {
      const dataToSave = {
        players: data,
        teamNames: teamNames,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error("Không thể lưu dữ liệu:", error)
    }
  }

  const loadFromLocalStorage = (): { players: Player[]; teamNames?: any } | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        // Backward compatibility
        if (Array.isArray(data)) {
          return { players: data }
        }
        return data
      }
    } catch (error) {
      console.error("Không thể tải dữ liệu:", error)
    }
    return null
  }

  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setPlayers(Array.from({ length: 14 }, (_, i) => ({ name: "", skill: "average" as SkillLevel })))
    } catch (error) {
      console.error("Không thể xóa dữ liệu:", error)
    }
  }

  // Thêm useEffect để load dữ liệu khi component mount:
  useEffect(() => {
    const savedData = loadFromLocalStorage()
    if (savedData?.players && savedData.players.length === 14) {
      setPlayers(savedData.players)
      if (savedData.teamNames) {
        setTeamNames(savedData.teamNames)
      }
    }
  }, [])

  // Thêm useEffect để save dữ liệu khi players thay đổi:
  useEffect(() => {
    // Chỉ save nếu có ít nhất 1 cầu thủ có tên
    const hasData = players.some((player) => player.name.trim() !== "")
    if (hasData) {
      saveToLocalStorage(players)
    }
  }, [players, teamNames])

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setPlayers(newPlayers)
  }

  const handleAvatarUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newPlayers = [...players]
        newPlayers[index] = { ...newPlayers[index], avatar: e.target?.result as string }
        setPlayers(newPlayers)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = (index: number) => {
    const newPlayers = [...players]
    delete newPlayers[index].avatar
    setPlayers(newPlayers)
  }

  const balanceTeams = () => {
    const validPlayers = players.filter((p) => p.name.trim() !== "")
    if (validPlayers.length < 14) {
      alert("Vui lòng nhập đủ 14 tên cầu thủ!")
      return
    }

    // Sắp xếp cầu thủ theo trình độ giảm dần
    const sortedPlayers = [...validPlayers].sort((a, b) => skillValues[b.skill] - skillValues[a.skill])

    const team1: Player[] = []
    const team2: Player[] = []
    let team1Skill = 0
    let team2Skill = 0

    // Phân chia cầu thủ để cân bằng trình độ
    sortedPlayers.forEach((player, index) => {
      if (team1.length < 7 && (team2.length === 7 || team1Skill <= team2Skill)) {
        team1.push({
          ...player,
          position: defaultPositions.team1[team1.length],
        })
        team1Skill += skillValues[player.skill]
      } else {
        team2.push({
          ...player,
          position: defaultPositions.team2[team2.length],
        })
        team2Skill += skillValues[player.skill]
      }
    })

    setTeams([
      { name: teamNames.team1, players: team1, totalSkill: team1Skill },
      { name: teamNames.team2, players: team2, totalSkill: team2Skill },
    ])
    setShowLineup(true)
  }

  const updateTeamPlayer = (teamIndex: number, playerIndex: number, newName: string) => {
    const newTeams = [...teams]
    newTeams[teamIndex].players[playerIndex].name = newName
    setTeams(newTeams)
    setEditingPlayer(null)
  }

  const updatePlayerPosition = (teamIndex: number, playerIndex: number, newPosition: { x: number; y: number }) => {
    const newTeams = [...teams]
    newTeams[teamIndex].players[playerIndex].position = newPosition
    setTeams(newTeams)
  }

  const resetForm = () => {
    setShowLineup(false)
    setTeams([])
    setEditingPlayer(null)
  }

  const handleMouseDown = (teamIndex: number, playerIndex: number, e: React.MouseEvent) => {
    e.preventDefault()
    setDraggedPlayer({ teamIndex, playerIndex })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedPlayer || !fieldRef.current) return

    const rect = fieldRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Constrain to field boundaries
    const constrainedX = Math.max(40, Math.min(x - 32, rect.width - 72))
    const constrainedY = Math.max(40, Math.min(y - 32, rect.height - 72))

    updatePlayerPosition(draggedPlayer.teamIndex, draggedPlayer.playerIndex, {
      x: constrainedX,
      y: constrainedY,
    })
  }

  const handleMouseUp = () => {
    setDraggedPlayer(null)
  }

  const updateTeamName = (teamIndex: number, newName: string) => {
    const newTeamNames = { ...teamNames }
    if (teamIndex === 0) {
      newTeamNames.team1 = newName
    } else {
      newTeamNames.team2 = newName
    }
    setTeamNames(newTeamNames)

    // Cập nhật luôn trong teams nếu đang hiển thị lineup
    if (teams.length > 0) {
      const newTeams = [...teams]
      newTeams[teamIndex].name = newName
      setTeams(newTeams)
    }
  }

  const exportFieldAsImage = async () => {
    if (!fieldRef.current) return

    try {
      setExportingImage(true)

      // Tạo container mới bao gồm tên đội và sân bóng
      const exportContainer = document.createElement("div")
      exportContainer.style.cssText = `
        background: linear-gradient(to bottom, #16a34a, #15803d);
        padding: 40px;
        width: ${fieldRef.current.offsetWidth + 80}px;
        position: relative;
      `

      // Thêm tiêu đề với tên đội
      const header = document.createElement("div")
      header.style.cssText = `
  text-align: center;
  margin-bottom: 30px;
  color: white;
  font-family: system-ui, -apple-system, sans-serif;
`
      header.innerHTML = `
  <div style="display: flex; justify-content: center; gap: 60px;">
    <div style="text-align: center;">
      <h2 style="font-size: 24px; font-weight: bold; color: #93c5fd; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
        ${teams[0]?.name || "Đội 1"}
      </h2>
      <p style="font-size: 16px; margin-top: 5px;">Tổng điểm: ${teams[0]?.totalSkill || 0}</p>
    </div>
    <div style="text-align: center;">
      <h2 style="font-size: 24px; font-weight: bold; color: #fca5a5; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
        ${teams[1]?.name || "Đội 2"}
      </h2>
      <p style="font-size: 16px; margin-top: 5px;">Tổng điểm: ${teams[1]?.totalSkill || 0}</p>
    </div>
  </div>
`

      // Clone sân bóng
      const fieldClone = fieldRef.current.cloneNode(true) as HTMLElement
      fieldClone.style.margin = "0 auto"

      exportContainer.appendChild(header)
      exportContainer.appendChild(fieldClone)
      document.body.appendChild(exportContainer)

      // Tạm thời ẩn các tooltip và nút khi export
      exportContainer.classList.add("exporting")

      const canvas = await html2canvas(exportContainer, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
      })

      // Xóa container tạm thời
      document.body.removeChild(exportContainer)

      // Tạo link download
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `doi-hinh-${teams[0]?.name.replace(/\s+/g, "-")}-vs-${teams[1]?.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Lỗi khi xuất hình ảnh:", error)
      alert("Có lỗi khi xuất hình ảnh. Vui lòng thử lại!")
    } finally {
      setExportingImage(false)
    }
  }

  const FootballField = () => (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
      {/* Field background */}
      <defs>
        <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="#2d5a2d" />
          <rect width="2" height="2" fill="#3d6a3d" />
          <rect x="2" y="2" width="2" height="2" fill="#3d6a3d" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#grass)" />

      {/* Field outline */}
      <rect x="40" y="40" width="720" height="520" fill="none" stroke="white" strokeWidth="3" />

      {/* Center line */}
      <line x1="400" y1="40" x2="400" y2="560" stroke="white" strokeWidth="3" />

      {/* Center circle */}
      <circle cx="400" cy="300" r="80" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="400" cy="300" r="2" fill="white" />

      {/* Left penalty area */}
      <rect x="40" y="180" width="120" height="240" fill="none" stroke="white" strokeWidth="3" />
      <rect x="40" y="240" width="40" height="120" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="160" cy="300" r="80" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="120" cy="300" r="2" fill="white" />

      {/* Right penalty area */}
      <rect x="640" y="180" width="120" height="240" fill="none" stroke="white" strokeWidth="3" />
      <rect x="720" y="240" width="40" height="120" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="640" cy="300" r="80" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="680" cy="300" r="2" fill="white" />

      {/* Corner arcs */}
      <path d="M 40 40 Q 50 40 50 50" fill="none" stroke="white" strokeWidth="2" />
      <path d="M 760 40 Q 750 40 750 50" fill="none" stroke="white" strokeWidth="2" />
      <path d="M 40 560 Q 50 560 50 550" fill="none" stroke="white" strokeWidth="2" />
      <path d="M 760 560 Q 750 560 750 550" fill="none" stroke="white" strokeWidth="2" />

      {/* Goals */}
      <rect x="35" y="270" width="10" height="60" fill="none" stroke="white" strokeWidth="2" />
      <rect x="755" y="270" width="10" height="60" fill="none" stroke="white" strokeWidth="2" />
    </svg>
  )

  const PlayerPosition = ({
    player,
    teamIndex,
    playerIndex,
  }: {
    player: Player
    teamIndex: number
    playerIndex: number
  }) => {
    const isEditing = editingPlayer?.teamIndex === teamIndex && editingPlayer?.playerIndex === playerIndex
    const isDragging = draggedPlayer?.teamIndex === teamIndex && draggedPlayer?.playerIndex === playerIndex

    return (
      <div
        className={`absolute cursor-move group transition-all duration-200 ${isDragging ? "scale-110 z-50" : "hover:scale-105"}`}
        style={{
          left: `${player.position?.x || 0}px`,
          top: `${player.position?.y || 0}px`,
          transform: "translate(-50%, -50%)",
        }}
        onMouseDown={(e) => handleMouseDown(teamIndex, playerIndex, e)}
      >
        <div
          className={`
          w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden
          ${teamIndex === 0 ? "border-4 border-blue-500" : "border-4 border-red-500"}
          ${isDragging ? "shadow-2xl" : "shadow-lg"}
        `}
        >
          {player.avatar ? (
            <img
              src={player.avatar || "/placeholder.svg"}
              alt={player.name}
              className="w-full h-full object-cover rounded-full"
              draggable={false}
            />
          ) : (
            <div
              className={`w-full h-full rounded-full flex items-center justify-center ${
                teamIndex === 0 ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updateTeamPlayer(teamIndex, playerIndex, e.target.value)}
                  onBlur={() => setEditingPlayer(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingPlayer(null)}
                  className="w-12 h-8 text-xs text-center bg-white text-black rounded border-none outline-none"
                  autoFocus
                />
              ) : (
                <span className="text-center leading-tight px-1">
                  {player.name
                    .split(" ")
                    .map((word) => word.charAt(0))
                    .join("")
                    .slice(0, 3)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Player name - always visible */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white bg-black bg-opacity-70 px-2 py-1 rounded whitespace-nowrap">
          {player.name}
        </div>

        {/* Player name tooltip for hover (export-hide) */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white bg-black bg-opacity-70 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap export-hide">
          {player.name}
        </div>

        {/* Edit and move icons */}
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity export-hide">
          <Edit3
            className="w-4 h-4 text-white bg-gray-600 rounded-full p-1 cursor-pointer hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation()
              setEditingPlayer({ teamIndex, playerIndex })
            }}
          />
          <Move className="w-4 h-4 text-white bg-green-600 rounded-full p-1 cursor-move hover:bg-green-700" />
        </div>
      </div>
    )
  }

  if (showLineup) {
    return (
      <div className="min-h-screen bg-green-800 relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Đội Hình Đã Sắp Xếp</h1>
            <div className="flex justify-center gap-8 mb-6">
              {teams.map((team, index) => (
                <div key={index} className="text-center">
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => updateTeamName(index, e.target.value)}
                    className={`text-2xl font-bold drop-shadow-lg bg-transparent border-b-2 text-center outline-none ${
                      index === 0 ? "text-blue-200 border-blue-200" : "text-red-200 border-red-200"
                    } placeholder-opacity-70`}
                    placeholder={`Tên đội ${index + 1}`}
                  />
                  <p className="text-white drop-shadow">Tổng điểm: {team.totalSkill}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={resetForm} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                <Shuffle className="w-4 h-4 mr-2" />
                Sắp xếp lại
              </Button>
              <Button
                onClick={exportFieldAsImage}
                disabled={exportingImage}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
              >
                {exportingImage ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Xuất hình ảnh
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Football field with drag & drop */}
          <div className="max-w-6xl mx-auto">
            <div
              ref={fieldRef}
              className="relative w-full h-[650px] bg-green-600 rounded-lg shadow-2xl overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Football field background */}
              <FootballField />

              {/* Players */}
              {teams.map((team, teamIndex) =>
                team.players.map((player, playerIndex) => (
                  <PlayerPosition
                    key={`${teamIndex}-${playerIndex}`}
                    player={player}
                    teamIndex={teamIndex}
                    playerIndex={playerIndex}
                  />
                )),
              )}
            </div>
          </div>

          <div className="text-center mt-6 text-white text-sm drop-shadow">
            <p>🖱️ Kéo thả cầu thủ để thay đổi vị trí trên sân</p>
            <p>✏️ Nhấp vào biểu tượng chỉnh sửa để thay đổi tên cầu thủ</p>
            <p>📸 Nhấn "Xuất hình ảnh" để lưu đội hình thành file PNG</p>
          </div>
        </div>
      </div>
    )
  }

  const handleImportData = (importedPlayers: Player[]) => {
    setPlayers(importedPlayers)
  }

  const handleExportData = () => {
    // Function này sẽ được handle bởi DataStatus component
  }

  const handleClearAllData = () => {
    if (confirm("Bạn có chắc muốn xóa tất cả dữ liệu đã lưu?")) {
      clearLocalStorage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-green-600 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Users className="w-12 h-12" />
            Sắp Xếp Đội Bóng
          </h1>
          <p className="text-xl text-green-100">Tạo đội hình cân bằng và công bằng cho trận đấu của bạn!</p>
        </div>

        <Card className="max-w-5xl mx-auto shadow-2xl border-0">
          <CardHeader className="bg-white">
            <CardTitle className="text-2xl text-center text-green-700 flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              Nhập Thông Tin 14 Cầu Thủ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {players.map((player, index) => (
                <div key={index} className="flex gap-3 items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Avatar section */}
                  <div className="flex-shrink-0">
                    {player.avatar ? (
                      <div className="relative">
                        <img
                          src={player.avatar || "/placeholder.svg"}
                          alt={`Avatar ${index + 1}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-300"
                        />
                        <button
                          onClick={() => removeAvatar(index)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAvatarUpload(index, e)}
                          className="hidden"
                        />
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 hover:border-green-400 hover:bg-green-50 transition-colors">
                          <Upload className="w-4 h-4 text-gray-500" />
                        </div>
                      </label>
                    )}
                  </div>

                  <Input
                    placeholder={`Tên cầu thủ ${index + 1}`}
                    value={player.name}
                    onChange={(e) => updatePlayer(index, "name", e.target.value)}
                    className="flex-1 border-green-300 focus:border-green-500"
                  />
                  <Select
                    value={player.skill}
                    onValueChange={(value: SkillLevel) => updatePlayer(index, "skill", value)}
                  >
                    <SelectTrigger className="w-32 border-green-300 focus:border-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good" className="text-green-600 font-medium">
                        ⭐⭐⭐ Tốt
                      </SelectItem>
                      <SelectItem value="average" className="text-yellow-600 font-medium">
                        ⭐⭐ Trung bình
                      </SelectItem>
                      <SelectItem value="weak" className="text-orange-600 font-medium">
                        ⭐ Yếu
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={balanceTeams}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Shuffle className="w-6 h-6 mr-3" />🏆 Sắp Xếp Đội Hình Ngay!
              </Button>
              <div className="flex justify-center gap-4 mt-4"></div>
            </div>

            <DataStatus
              players={players}
              onImportData={handleImportData}
              onExportData={handleExportData}
              onClearData={handleClearAllData}
            />

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>💡 Hệ thống sẽ tự động cân bằng trình độ giữa hai đội để trận đấu thêm hấp dẫn!</p>
              <p>📸 Click vào biểu tượng upload để thêm avatar cho từng cầu thủ</p>
              <p>🖱️ Sau khi sắp xếp, bạn có thể kéo thả cầu thủ để thay đổi vị trí!</p>
              <p>💾 Dữ liệu sẽ được tự động lưu và khôi phục khi bạn quay lại trang</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
