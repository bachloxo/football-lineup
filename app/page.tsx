"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Shuffle, Edit3, Upload, X, Move, Camera, ArrowLeftRight } from "lucide-react"
import DataStatus from "@/components/data-status"
import html2canvas from "html2canvas"

type SkillLevel = "excellent" | "good" | "average"

interface Player {
  name: string
  skill: SkillLevel
  avatar?: string
  position?: { x: number; y: number }
  isFixed?: boolean
}

interface Team {
  name: string
  players: Player[]
  totalSkill: number
}

const skillValues = {
  excellent: 5,
  good: 3,
  average: 1,
}

const skillLabels = {
  excellent: "Đá Tốt",
  good: "Đá Ổn",
  average: "Đá Tạm",
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
    Array.from({ length: 14 }, (_, i) => ({ name: "", skill: "good" as SkillLevel, isFixed: false })),
  )
  const [teams, setTeams] = useState<Team[]>([])
  const [showLineup, setShowLineup] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<{ teamIndex: number; playerIndex: number } | null>(null)
  const [draggedPlayer, setDraggedPlayer] = useState<{ teamIndex: number; playerIndex: number } | null>(null)
  const [exportingImage, setExportingImage] = useState(false)
  const fieldRef = useRef<HTMLDivElement>(null)
  const [teamNames, setTeamNames] = useState({ team1: "Đội Xanh", team2: "Đội Đỏ" })

  // Thêm state cho drag & drop trong form
  const [draggedFormPlayer, setDraggedFormPlayer] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<"left" | "right" | null>(null)

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
          // Nếu data cũ có 14 phần tử, mở rộng thành 20
          if (data.length === 14) {
            const expandedData = [
              ...data,
              ...Array.from({ length: 6 }, () => ({ name: "", skill: "good" as SkillLevel, isFixed: false })),
            ]
            return { players: expandedData }
          }
          return { players: data }
        }
        // Nếu players cũ có 14 phần tử, mở rộng thành 20
        if (data.players && data.players.length === 14) {
          const expandedPlayers = [
            ...data.players,
            ...Array.from({ length: 6 }, () => ({ name: "", skill: "good" as SkillLevel, isFixed: false })),
          ]
          return { ...data, players: expandedPlayers }
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
      setPlayers(Array.from({ length: 14 }, (_, i) => ({ name: "", skill: "good" as SkillLevel, isFixed: false })))
    } catch (error) {
      console.error("Không thể xóa dữ liệu:", error)
    }
  }

  // Thêm useEffect để load dữ liệu khi component mount:
  useEffect(() => {
    const savedData = loadFromLocalStorage()
    if (savedData?.players) {
      // Ensure backward compatibility by adding isFixed property if it doesn't exist
      const playersWithFixed = savedData.players.map((player) => ({
        ...player,
        isFixed: player.isFixed || false,
      }))
      setPlayers(playersWithFixed)
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

  const updatePlayer = (index: number, field: keyof Player, value: string | boolean) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setPlayers(newPlayers)
  }

  const addPlayer = (side: "left" | "right") => {
    const newPlayers = [...players]
    const newPlayer = { name: "", skill: "good" as SkillLevel, isFixed: false }
    const leftCount = Math.ceil(players.length / 2)

    if (side === "left") {
      // Thêm vào cuối cột trái (ngay trước vị trí bắt đầu cột phải)
      newPlayers.splice(leftCount, 0, newPlayer)
    } else {
      // Thêm vào cuối cột phải (cuối array)
      newPlayers.push(newPlayer)
    }

    setPlayers(newPlayers)
  }

  const removePlayer = (index: number) => {
    if (players.length <= 2) return // Tối thiểu 2 cầu thủ

    // Chỉ xóa cầu thủ tại index được chỉ định
    const newPlayers = [...players]
    newPlayers.splice(index, 1)
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

  // Thêm functions cho drag & drop trong form
  const handleFormDragStart = (e: React.DragEvent, playerIndex: number) => {
    setDraggedFormPlayer(playerIndex)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleFormDragEnd = () => {
    setDraggedFormPlayer(null)
    setDragOverColumn(null)
  }

  const handleColumnDragOver = (e: React.DragEvent, column: "left" | "right") => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(column)
  }

  const handleColumnDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleColumnDrop = (e: React.DragEvent, targetColumn: "left" | "right") => {
    e.preventDefault()
    if (draggedFormPlayer === null) return

    const draggedIndex = draggedFormPlayer
    const leftCount = Math.ceil(players.length / 2)
    const isCurrentlyInLeftColumn = draggedIndex < leftCount
    const shouldMoveToLeftColumn = targetColumn === "left"

    // Nếu đã ở đúng cột thì không làm gì
    if ((isCurrentlyInLeftColumn && shouldMoveToLeftColumn) || (!isCurrentlyInLeftColumn && !shouldMoveToLeftColumn)) {
      setDraggedFormPlayer(null)
      setDragOverColumn(null)
      return
    }

    const newPlayers = [...players]
    const draggedPlayer = newPlayers[draggedIndex]

    // Xóa cầu thủ khỏi vị trí cũ
    newPlayers.splice(draggedIndex, 1)

    // Tính toán vị trí chèn mới - LUÔN CHÈN VÀO CUỐI CỘT ĐÍCH
    let insertIndex: number
    if (shouldMoveToLeftColumn) {
      // Chèn vào cuối cột trái
      // Tìm vị trí cuối cùng của cột trái sau khi đã xóa player
      const currentLeftCount = newPlayers.filter(
        (_, idx) => idx < leftCount - (draggedIndex < leftCount ? 1 : 0),
      ).length
      insertIndex = currentLeftCount
    } else {
      // Chèn vào cuối cột phải (cuối array)
      insertIndex = newPlayers.length
    }

    // Chèn cầu thủ vào vị trí mới
    newPlayers.splice(insertIndex, 0, draggedPlayer)

    setPlayers(newPlayers)
    setDraggedFormPlayer(null)
    setDragOverColumn(null)
  }

  const balanceTeams = () => {
    const validPlayers = players.filter((p) => p.name.trim() !== "")
    if (validPlayers.length < 2) {
      alert("Vui lòng nhập ít nhất 2 tên cầu thủ!")
      return
    }

    // Đếm số lượng cầu thủ ở mỗi cột
    const leftCount = Math.ceil(players.length / 2)
    const leftColumnPlayers = players.slice(0, leftCount).filter((p) => p.name.trim() !== "")
    const rightColumnPlayers = players.slice(leftCount).filter((p) => p.name.trim() !== "")

    if (leftColumnPlayers.length !== rightColumnPlayers.length) {
      alert(
        `Số lượng cầu thủ không cân bằng!\nĐội A: ${leftColumnPlayers.length} người\nĐội B: ${rightColumnPlayers.length} người\n\nVui lòng kéo thả để có số lượng cân bằng.`,
      )
      return
    }

    const playersPerTeam = leftColumnPlayers.length
    const team1: Player[] = []
    const team2: Player[] = []
    let team1Skill = 0
    let team2Skill = 0

    // Tạo positions động dựa trên số lượng cầu thủ
    const createDynamicPositions = (teamSide: "left" | "right", playerCount: number) => {
      const positions = []
      const fieldWidth = 800
      const fieldHeight = 600

      if (teamSide === "left") {
        // Đội bên trái
        for (let i = 0; i < playerCount; i++) {
          const x = 80 + (i % 2) * 120 + Math.random() * 40
          const y = 100 + (i * (fieldHeight - 200)) / Math.max(1, playerCount - 1)
          positions.push({ x, y })
        }
      } else {
        // Đội bên phải
        for (let i = 0; i < playerCount; i++) {
          const x = 600 + (i % 2) * 120 + Math.random() * 40
          const y = 100 + (i * (fieldHeight - 200)) / Math.max(1, playerCount - 1)
          positions.push({ x, y })
        }
      }

      return positions
    }

    const team1Positions = createDynamicPositions("left", playersPerTeam)
    const team2Positions = createDynamicPositions("right", playersPerTeam)

    // Xử lý cầu thủ từ cột trái (Đội A)
    leftColumnPlayers.forEach((player, index) => {
      team1.push({
        ...player,
        position: team1Positions[index],
      })
      team1Skill += skillValues[player.skill]
    })

    // Xử lý cầu thủ từ cột phải (Đội B)
    rightColumnPlayers.forEach((player, index) => {
      team2.push({
        ...player,
        position: team2Positions[index],
      })
      team2Skill += skillValues[player.skill]
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
    // Đảm bảo có ít nhất 2 cầu thủ và số chẵn
    let playersToImport = importedPlayers
    if (playersToImport.length < 2) {
      playersToImport = [
        ...playersToImport,
        ...Array.from({ length: 2 - playersToImport.length }, () => ({
          name: "",
          skill: "good" as SkillLevel,
          isFixed: false,
        })),
      ]
    }
    if (playersToImport.length % 2 !== 0) {
      playersToImport.push({ name: "", skill: "good" as SkillLevel, isFixed: false })
    }
    setPlayers(playersToImport)
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

        <Card className="max-w-6xl mx-auto shadow-2xl border-0">
          <CardContent className="p-6 bg-white">
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 text-center">
                <ArrowLeftRight className="w-4 h-4 inline mr-1" />
                <strong>Kéo thả cầu thủ</strong> giữa các cột để chuyển đội. Số lượng có thể không cân bằng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Cột bên trái */}
              <div
                className={`space-y-3 p-4 rounded-lg border-2 transition-all ${
                  dragOverColumn === "left" ? "border-blue-400 bg-blue-50 shadow-lg" : "border-blue-200 bg-blue-25"
                }`}
                onDragOver={(e) => handleColumnDragOver(e, "left")}
                onDragLeave={handleColumnDragLeave}
                onDrop={(e) => handleColumnDrop(e, "left")}
              >
                <div className="text-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200 sticky top-0 z-10">
                  <h3 className="text-lg font-bold text-blue-700 mb-1">
                    Đội A ({players.slice(0, Math.ceil(players.length / 2)).filter((p) => p.name.trim() !== "").length}/
                    {Math.ceil(players.length / 2)})
                  </h3>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => addPlayer("left")}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1"
                    >
                      + Thêm
                    </Button>
                  </div>
                </div>
                {players.slice(0, Math.ceil(players.length / 2)).map((player, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleFormDragStart(e, index)}
                    onDragEnd={handleFormDragEnd}
                    className={`flex gap-3 items-center p-3 rounded-lg border-2 transition-all cursor-move ${
                      player.name.trim()
                        ? player.isFixed
                          ? "bg-blue-50 border-blue-300 shadow-md"
                          : "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    } ${draggedFormPlayer === index ? "opacity-50 scale-95" : "hover:shadow-md"}`}
                  >
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
                            className="w-10 h-10 rounded-full object-cover border-2 border-green-300"
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
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 hover:border-green-400 hover:bg-green-50 transition-colors">
                            <Upload className="w-3 h-3 text-gray-500" />
                          </div>
                        </label>
                      )}
                    </div>

                    <Input
                      placeholder={`Tên cầu thủ ${index + 1}`}
                      value={player.name}
                      onChange={(e) => updatePlayer(index, "name", e.target.value)}
                      className="flex-1 border-green-300 focus:border-green-500 text-sm"
                    />

                    <Select
                      value={player.skill}
                      onValueChange={(value: SkillLevel) => updatePlayer(index, "skill", value)}
                    >
                      <SelectTrigger className="w-20 border-green-300 focus:border-green-500 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent" className="text-green-600 font-medium text-xs">
                          Tốt
                        </SelectItem>
                        <SelectItem value="good" className="text-blue-600 font-medium text-xs">
                          Ổn
                        </SelectItem>
                        <SelectItem value="average" className="text-orange-600 font-medium text-xs">
                          Tạm
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Checkbox fixed */}
                    <div className="flex flex-col items-center gap-1">
                      <Checkbox
                        id={`fix-${index}`}
                        checked={player.isFixed || false}
                        onCheckedChange={(checked) => updatePlayer(index, "isFixed", checked as boolean)}
                        className="border-2 border-blue-400 data-[state=checked]:bg-blue-500"
                      />
                      <label htmlFor={`fix-${index}`} className="text-xs font-medium cursor-pointer text-blue-600">
                        Fix
                      </label>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        removePlayer(index) // Sử dụng index thực tế của cột trái
                      }}
                      className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      disabled={players.length <= 2}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Cột bên phải */}
              <div
                className={`space-y-3 p-4 rounded-lg border-2 transition-all ${
                  dragOverColumn === "right" ? "border-red-400 bg-red-50 shadow-lg" : "border-red-200 bg-red-25"
                }`}
                onDragOver={(e) => handleColumnDragOver(e, "right")}
                onDragLeave={handleColumnDragLeave}
                onDrop={(e) => handleColumnDrop(e, "right")}
              >
                <div className="text-center p-3 bg-red-50 rounded-lg border-2 border-red-200 sticky top-0 z-10">
                  <h3 className="text-lg font-bold text-red-700 mb-1">
                    Đội B ({players.slice(Math.ceil(players.length / 2)).filter((p) => p.name.trim() !== "").length}/
                    {Math.floor(players.length / 2)})
                  </h3>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => addPlayer("right")}
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1"
                    >
                      + Thêm
                    </Button>
                  </div>
                </div>
                {players.slice(Math.ceil(players.length / 2)).map((player, index) => {
                  const actualIndex = index + Math.ceil(players.length / 2)
                  return (
                    <div
                      key={actualIndex}
                      draggable
                      onDragStart={(e) => handleFormDragStart(e, actualIndex)}
                      onDragEnd={handleFormDragEnd}
                      className={`flex gap-3 items-center p-3 rounded-lg border-2 transition-all cursor-move ${
                        player.name.trim()
                          ? player.isFixed
                            ? "bg-red-50 border-red-300 shadow-md"
                            : "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200 opacity-60"
                      } ${draggedFormPlayer === actualIndex ? "opacity-50 scale-95" : "hover:shadow-md"}`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {actualIndex + 1}
                      </div>

                      {/* Avatar section */}
                      <div className="flex-shrink-0">
                        {player.avatar ? (
                          <div className="relative">
                            <img
                              src={player.avatar || "/placeholder.svg"}
                              alt={`Avatar ${actualIndex + 1}`}
                              className="w-10 h-10 rounded-full object-cover border-2 border-green-300"
                            />
                            <button
                              onClick={() => removeAvatar(actualIndex)}
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
                              onChange={(e) => handleAvatarUpload(actualIndex, e)}
                              className="hidden"
                            />
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 hover:border-green-400 hover:bg-green-50 transition-colors">
                              <Upload className="w-3 h-3 text-gray-500" />
                            </div>
                          </label>
                        )}
                      </div>

                      <Input
                        placeholder={`Tên cầu thủ ${actualIndex + 1}`}
                        value={player.name}
                        onChange={(e) => updatePlayer(actualIndex, "name", e.target.value)}
                        className="flex-1 border-green-300 focus:border-green-500 text-sm"
                      />

                      <Select
                        value={player.skill}
                        onValueChange={(value: SkillLevel) => updatePlayer(actualIndex, "skill", value)}
                      >
                        <SelectTrigger className="w-20 border-green-300 focus:border-green-500 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent" className="text-green-600 font-medium text-xs">
                            Tốt
                          </SelectItem>
                          <SelectItem value="good" className="text-blue-600 font-medium text-xs">
                            Ổn
                          </SelectItem>
                          <SelectItem value="average" className="text-orange-600 font-medium text-xs">
                            Tạm
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Checkbox fixed */}
                      <div className="flex flex-col items-center gap-1">
                        <Checkbox
                          id={`fix-${actualIndex}`}
                          checked={player.isFixed || false}
                          onCheckedChange={(checked) => updatePlayer(actualIndex, "isFixed", checked as boolean)}
                          className="border-2 border-red-400 data-[state=checked]:bg-red-500"
                        />
                        <label
                          htmlFor={`fix-${actualIndex}`}
                          className="text-xs font-medium cursor-pointer text-red-600"
                        >
                          Fix
                        </label>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removePlayer(actualIndex) // Sử dụng actualIndex đã tính toán đúng
                        }}
                        className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        disabled={players.length <= 2}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
