import {NextResponse} from "next/server";
import * as XLSX from "xlsx";
import {getStats, getTeamById, getTeams} from "@/lib/db";

export async function GET() {
    try {
        const [teams, stats] = await Promise.all([getTeams(), getStats()]);

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Summary Statistics
        const summaryData = [
            ["Thống kê Check-in - Hackathon 2026"],
            [],
            ["Tổng số thành viên", stats.totalMembers],
            ["Đã check-in", stats.checkedIn],
            ["Chưa check-in", stats.totalMembers - stats.checkedIn],
            ["Tỷ lệ hoàn thành", `${stats.percentage}%`],
            [],
            ["Xuất lúc", new Date().toLocaleString("vi-VN")],
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet["!cols"] = [{wch: 25}, {wch: 20}];
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Tổng quan");

        // Sheet 2: Team Statistics
        const teamStatsData = [
            ["Đội", "Tổng số", "Đã check-in", "Chưa check-in", "Tỷ lệ", "Hoàn thành"],
            ...stats.teamStats.map((team) => [
                team.teamName,
                team.totalMembers,
                team.checkedIn,
                team.totalMembers - team.checkedIn,
                `${Math.round((team.checkedIn / team.totalMembers) * 100)}%`,
                team.isComplete ? "✓" : "",
            ]),
        ];

        const teamStatsSheet = XLSX.utils.aoa_to_sheet(teamStatsData);
        teamStatsSheet["!cols"] = [
            {wch: 25},
            {wch: 10},
            {wch: 12},
            {wch: 14},
            {wch: 10},
            {wch: 12},
        ];
        XLSX.utils.book_append_sheet(workbook, teamStatsSheet, "Thống kê đội");

        // Fetch fresh data for each team using getTeamById
        const freshTeams = await Promise.all(
            teams.map((team) => getTeamById(team.id))
        );
        const validTeams = freshTeams.filter((team) => team !== null);

        // Sheet 3: All Members Detail
        const membersData = [
            ["Đội", "Tên thành viên", "Email", "Trạng thái", "Thời gian check-in"],
            ...validTeams.flatMap((team) =>
                team.members.map((member) => [
                    team.name,
                    member.name,
                    member.email || "",
                    member.checkedIn ? "Đã check-in" : "Chưa check-in",
                    member.checkedInAt
                        ? new Date(member.checkedInAt).toLocaleString("vi-VN")
                        : "",
                ])
            ),
        ];

        const membersSheet = XLSX.utils.aoa_to_sheet(membersData);
        membersSheet["!cols"] = [
            {wch: 25},
            {wch: 25},
            {wch: 30},
            {wch: 15},
            {wch: 20},
        ];
        XLSX.utils.book_append_sheet(workbook, membersSheet, "Chi tiết thành viên");

        // Sheet 4: Checked-in Members Only
        const checkedInData = [
            ["Đội", "Tên thành viên", "Email", "Thời gian check-in"],
            ...validTeams.flatMap((team) =>
                team.members
                    .filter((member) => member.checkedIn)
                    .map((member) => [
                        team.name,
                        member.name,
                        member.email || "",
                        member.checkedInAt
                            ? new Date(member.checkedInAt).toLocaleString("vi-VN")
                            : "",
                    ])
            ),
        ];

        const checkedInSheet = XLSX.utils.aoa_to_sheet(checkedInData);
        checkedInSheet["!cols"] = [
            {wch: 25},
            {wch: 25},
            {wch: 30},
            {wch: 20},
        ];
        XLSX.utils.book_append_sheet(workbook, checkedInSheet, "Đã check-in");

        // Sheet 5: Not Checked-in Members
        const notCheckedInData = [
            ["Đội", "Tên thành viên", "Email"],
            ...validTeams.flatMap((team) =>
                team.members
                    .filter((member) => !member.checkedIn)
                    .map((member) => [team.name, member.name, member.email || ""])
            ),
        ];

        const notCheckedInSheet = XLSX.utils.aoa_to_sheet(notCheckedInData);
        notCheckedInSheet["!cols"] = [{wch: 25}, {wch: 25}, {wch: 30}];
        XLSX.utils.book_append_sheet(workbook, notCheckedInSheet, "Chưa check-in");

        // Generate buffer
        const buffer = XLSX.write(workbook, {type: "buffer", bookType: "xlsx"});

        // Generate filename with timestamp
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, 19);
        const filename = `checkin-report-${timestamp}.xlsx`;

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Error generating Excel:", error);
        return NextResponse.json(
            {success: false, error: "Failed to generate Excel file"},
            {status: 500}
        );
    }
}
