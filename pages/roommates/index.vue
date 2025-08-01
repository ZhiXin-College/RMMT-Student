<template>
    <div class="roommates">
        <PageHeader title="舍友大厅 | Matching Hall"></PageHeader>
        
        <!-- 控制面板 -->
        <el-row type="flex" justify="center" class="control-panel">
            <el-col :span="24">
                <div class="default-container">
                    <el-row type="flex" justify="space-between" align="middle">
                        <el-col :span="12">
                            <el-switch
                                v-model="onlyShowUnteamed"
                                active-text="仅显示未组队/未满员同学"
                                inactive-text="显示所有推荐"
                                style="min-width: 230px;"
                            />
                        </el-col>
                        <el-col :span="8" style="text-align: right;">
                            <span style="margin-right: 10px;">每页显示:</span>
                            <el-select v-model="pageSize" size="small" style="width: 80px;">
                                <el-option label="8" :value="8"></el-option>
                                <el-option label="16" :value="16"></el-option>
                                <el-option label="50" :value="50"></el-option>
                                <el-option label="100" :value="100"></el-option>
                                <el-option label="200" :value="200"></el-option>
                            </el-select>
                        </el-col>
                    </el-row>
                </div>
            </el-col>
        </el-row>
        
        <!-- 有评分的学生 -->
        <el-row type="flex" justify="center" v-if="paginatedStudentsWithScore.length > 0">
            <el-col :span="30">
                <div class="default-container">
                    <h3 class="section-title">推荐匹配 ({{ filtered_student_with_score.length }}人)</h3>
                    <div class="students-grid">
                        <div 
                            v-for="student in paginatedStudentsWithScore" 
                            :key="student.id"
                            class="student-card-wrapper"
                        >
                            <StudentCard :student="student" />
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>
        
        <!-- 无评分的学生 -->
        <el-row type="flex" justify="center" v-if="paginatedStudentsWithNoScore.length > 0" style="position: relative; top: -50px;">
            <el-col :span="24">
                <div class="default-container">
                    <h3 class="section-title">其他同学 ({{ filtered_student_with_no_score.length }}人)</h3>
                    <div class="students-grid">
                        <div 
                            v-for="student in paginatedStudentsWithNoScore" 
                            :key="student.id"
                            class="student-card-wrapper"
                        >
                            <StudentCard :student="student" />
                        </div>
                    </div>
                </div>
            </el-col>   
        </el-row>
        
        <!-- 分页组件 -->
        <el-row type="flex" justify="center" v-if="totalPages > 1">
            <el-col :span="24">
                <div class="default-container">
                    <div class="pagination-container">
                        <el-pagination
                            @current-change="handleCurrentChange"
                            :current-page="currentPage"
                            :page-size="pageSize"
                            :total="totalStudents"
                            layout="total, prev, pager, next, jumper"
                            background
                        >
                        </el-pagination>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>

export default {
    name: "index",
    data() {
        return {
            student_with_score: [],
            student_with_no_score: [],
            onlyShowUnteamed: false,
            currentPage: 1,
            pageSize: 16
        }
    },
    computed: {
        filtered_student_with_score() {
            if (!this.onlyShowUnteamed) return this.student_with_score
            const unteamed = this.student_with_score
                .filter(student => student.team_students_num < 4)
            return unteamed
        },
        filtered_student_with_no_score() {
            if (!this.onlyShowUnteamed) return this.student_with_no_score
            const unteamed = this.student_with_no_score
                .filter(student => student.team_students_num < 4)
            return unteamed
        },
        allFilteredStudents() {
            return [...this.filtered_student_with_score, ...this.filtered_student_with_no_score]
        },
        totalStudents() {
            return this.allFilteredStudents.length
        },
        totalPages() {
            return Math.ceil(this.totalStudents / this.pageSize)
        },
        currentPageStudents() {
            const start = (this.currentPage - 1) * this.pageSize
            const end = start + this.pageSize
            return this.allFilteredStudents.slice(start, end)
        },
        paginatedStudentsWithScore() {
            const scoreCount = this.filtered_student_with_score.length
            const start = (this.currentPage - 1) * this.pageSize
            const end = start + this.pageSize
            
            if (start >= scoreCount) return []
            if (end <= scoreCount) {
                return this.filtered_student_with_score.slice(start, end)
            } else {
                return this.filtered_student_with_score.slice(start, scoreCount)
            }
        },
        paginatedStudentsWithNoScore() {
            const scoreCount = this.filtered_student_with_score.length
            const start = (this.currentPage - 1) * this.pageSize
            const end = start + this.pageSize
            
            if (end <= scoreCount) return []
            if (start >= scoreCount) {
                const noScoreStart = start - scoreCount
                const noScoreEnd = end - scoreCount
                return this.filtered_student_with_no_score.slice(noScoreStart, noScoreEnd)
            } else {
                const noScoreStart = 0
                const noScoreEnd = end - scoreCount
                return this.filtered_student_with_no_score.slice(noScoreStart, noScoreEnd)
            }
        }
    },
    watch: {
        onlyShowUnteamed() {
            this.currentPage = 1
        },
        pageSize() {
            this.currentPage = 1
        }
    },
    methods: {
        handleCurrentChange(page) {
            this.currentPage = page
        }
    },
    async asyncData({$axios, $auth}) {
        let data = await $axios.$get("/team/recommend_teammates").then(data => {
            if (data.code === 200) {
                let student_with_score = data.data.students_with_score
                let student_with_no_score = _.filter(data.data.students_with_no_score, function (n) {
                    return $auth.user.id !== n.id
                })
                return {student_with_score, student_with_no_score}
            }
        })

        return data
    },
    filters: {
        numRounding(num) {
            num = parseFloat(num)
            if (!isNaN(num)) {
                return ((num + '').indexOf('.') == -1) ? num : num.toFixed(2);
            }
        }
    },
}
</script>

<style lang="scss" scoped>
.roommates {
    padding: 8px;
}

.control-panel {
    margin-bottom: 20px;
}

.default-container {
    max-width: 100%;
    padding: 20px;
}

.section-title {
    margin-bottom: 20px;
    color: #409EFF;
    font-weight: 500;
    border-bottom: 2px solid #EBEEF5;
    padding-bottom: 10px;
}

.students-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    /* 移除 container-type，iOS Safari 兼容性差 */
}

.student-card-wrapper {
    width: 100%;
}

.pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #EBEEF5;
}

/* 移动端适配 - 使用传统媒体查询替代 container queries */
@media (max-width: 600px) {
    .default-container {
        padding: 8px !important;
    }
    
    .students-grid {
        grid-template-columns: 1fr;
    }
    
    .control-panel .el-col {
        text-align: center;
        margin-bottom: 10px;
    }
}

@media (min-width: 601px) and (max-width: 900px) {
    .students-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 901px) and (max-width: 1200px) {
    .students-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1201px) {
    .students-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* iOS Safari 兼容性修复 */
@supports (-webkit-touch-callout: none) {
    .students-grid {
        /* 强制硬件加速，防止 iOS Safari 渲染问题 */
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
    }
    
    .student-card-wrapper {
        /* 防止 iOS Safari 中的子元素渲染问题 */
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
    }
    
    .default-container {
        /* 优化 iOS Safari 滚动体验 */
        -webkit-overflow-scrolling: touch;
    }
}
</style>
