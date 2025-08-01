<template>
    <div class="requests">
        
        <el-row type="flex" justify="center">
            <el-col :span="21">
                <PageHeader title="我的组队 | My Team"></PageHeader>
            </el-col>
        </el-row>
        <el-row type="flex" justify="center">
            <el-col :span="20">
                <div class="default-container">
                    <el-row>
                        <el-col :span="24">
                            <div class="card-title">
                                队伍信息
                            </div>
                        </el-col>
                    </el-row>
                    <el-row>
                        <div class="detail">
                            <div class="piece">
                                ID： {{ id }}
                            </div>
                            <div class="piece">
                                人数上限： {{ max_count }} 人
                            </div>
                        </div>
                    </el-row>
                    <br/>
                    <el-row>
                        <el-button @click="quit" type="danger">
                            退出队伍
                        </el-button>
                    </el-row>
                </div>
            </el-col>
        </el-row>

        <el-row type="flex" justify="center">
            <el-col :span="20">
                <div class="default-container">
                    <el-row>
                        <el-col :span="8">
                            <div class="card-title">
                                我的队友 | My Roommates
                            </div>
                        </el-col>
                    </el-row>
                    <el-row>
                        <el-col v-for=" student in students" v-if="student.id !== $auth.user.id" :span="8"
                                v-bind:key="student.id">
                            <StudentCard :student="student" />
                        </el-col>
                    </el-row>
                </div>
            </el-col>
        </el-row>

        <el-row type="flex" justify="center">
            <el-col :span="20">
                <div class="default-container">
                    <el-row>
                        <el-col :span="24">
                            <div class="card-title">
                                入队申请
                            </div>
                        </el-col>
                    </el-row>
                    <el-row>
                        <el-col v-if="team_requests.length === 0" :span="24">
                            <el-empty description="你的队伍还没有收到过入队申请哦，赶快去拉人吧~"></el-empty>
                        </el-col>

                        <el-col v-else :span="24">
                            <el-table
                                :data="team_requests"
                                stripe
                                style="width: 100%">
                                <el-table-column
                                    prop="id"
                                    label="#"
                                    width="120px">
                                </el-table-column>


                                <el-table-column
                                    label="申请人">
                                    <template #default="scope">
                                        <nuxt-link v-if="scope.row.student !== null"
                                                   :to="'/roommates/' + scope.row.student.id"
                                                   class="student-link">
                                            {{ scope.row.student.name }} ({{ scope.row.student.id }})
                                        </nuxt-link>
                                    </template>
                                </el-table-column>

                                <el-table-column
                                    label="状态">
                                    <template #default="scope">
                                        <el-tag v-if="scope.row.status === 0" type="primary">待处理</el-tag>
                                        <el-tag v-else-if="scope.row.status === -1" type="danger">已拒绝</el-tag>
                                        <el-tag v-else-if="scope.row.status === -2" type="info">已撤回</el-tag>
                                        <el-tag v-else-if="scope.row.status === 1" type="info">已接受</el-tag>
                                    </template>
                                </el-table-column>

                                <el-table-column
                                    label="备注"
                                    prop="reason">
                                </el-table-column>

                                <el-table-column
                                    label="创建时间"
                                    prop="created_at">
                                </el-table-column>

                                <el-table-column
                                    label="操作">
                                    <template #default="scope">
                                        <span v-if="scope.row.status !==0"></span>
                                        <div v-else>
                                            <el-button size="mini" @click="refuse(scope.row)"
                                                       type="danger">拒绝
                                            </el-button>
                                            <el-button size="mini" @click="accept(scope.row)"
                                                       type="success">接受
                                            </el-button>
                                        </div>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-col>
                    </el-row>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
import md5 from "md5";

export default {
    name: "my",
    data() {
        return {
            description: null,
            id: null,
            students: [],
            max_count: this.$store.state.system_settings.team_max_student_count,
            team_requests: []
        }
    },
    async asyncData({$axios, $auth, redirect}) {
        if ($auth.user.team === null) {
            redirect("/team/requests")
            return
        }

        let team = await $axios.$get("/team/detail").then(data => {
            if (data.code === 200) {
                return data.data
            }
        })

        let team_requests = await $axios.$get("/team/requests").then(data => {
            if (data.code === 200) {
                return data.data.team_requests
            }
        })

        team.team_requests = team_requests

        let students_with_score = await $axios.$get("/team/recommend_teammates").then(data => {
            return data.data.students_with_score;
        })

        for (let student of team.students) {
            let student_with_score = _.find(students_with_score, {id: student.id})
            if (student_with_score !== undefined) {
                student.score = student_with_score.score
            } else {
                student.score = null
            }
        }

        return team
    },
    async fetch({store}) {
        if (store.state.system_settings.step_1_start_at === null)
            await store.dispatch("refresh_system_settings")

    },
    methods: {
        jump(student) {
            this.$router.push("/roommates/" + student.id)
        },
        avatar(qq, id) {
            if (qq != null && qq.length > 0){
                return "http://q.qlogo.cn/headimg_dl?dst_uin=" + qq + "&spec=640&img_type=jpg"
            }else{
                let base_url = "https://gravatar.loli.net/avatar/"
                let email = new Date().getFullYear() + "rmmp." + id + "@chacuo.net"
                let hash = md5(email)
                return base_url + hash + "?d=retro"
            }
        },
        quit() {
            this.$confirm("你确定要退出当前队伍吗？退出后如果队伍剩余人数少于2人，队伍将会自动解散。").then(() => {
                this.$axios.$post("/team/quit").then(data => {
                    if (data.code === 200) {
                        this.$message.success("已退出当前队伍")
                        this.$auth.fetchUser().then(() => {
                            this.$router.push("/team/requests")
                        })
                    }
                })
            })

        },
        accept(request) {
            this.$confirm("你确定你和你的队员已经与这位同学充分沟通过，了解并能接受他所有的生活习惯吗？").then(() => {
                this.$axios.$post("/team/request/process", {
                    team_request_id: request.id,
                    accept: true
                }).then(data => {
                    if (data.code === 200) {
                        this.$message.success("申请已通过！")
                        request.status = 1
                        this.students.push(request.student)
                    }
                })
            })
        },
        refuse(request) {
            this.$confirm("你确定要拒绝这位同学的申请吗？").then(() => {
                this.$axios.$post("/team/request/process", {
                    team_request_id: request.id,
                    accept: false
                }).then(data => {
                    if (data.code === 200) {
                        this.$message.success("申请已拒绝")
                        request.status = -1
                    }
                })
            })
        },
        getTraits(contact){
            if(contact !== null && contact.length < 15){
                return contact.split(';').map(trait => trait.trim());
            }else{
                return null;
            }

        }
    },
}
</script>

<style scoped>
.detail {
    line-height: 2.3;
}
.contact{
    font-size: 10px;
    color: #999;
}
.label{
    display: inline-block;
    background-color: #ffae00d7;
    color: #fff;
    font-size: 8px;
    padding: 2px 4px;
    border-radius: 4px;
    vertical-align: middle;
    font-family: Arial, Helvetica, sans-serif;
    margin: 2px;
}

/* 移动端适配 */
@media (max-width: 600px) {
    /* 调整卡片布局 */
    .el-col {
        width: 100% !important;
        margin-bottom: 10px;
    }
    
    /* 调整表格显示 */
    .el-table {
        width: 100%;
        font-size: 13px;
    }
    
    /* 调整表格 ID 列宽度 */
    .el-table .el-table__row td:nth-child(1),
    .el-table .el-table__header th:nth-child(1) {
        width: 30px !important;
        min-width: 20px;
        padding: 8px 5px;
    }
    

    
    /* 调整按钮大小和间距 */
    .el-button {
        margin: 5px;
        font-size: 13px;
        padding: 8px 15px;
    }
    
    /* 调整标题大小 */
    .card-title {
        font-size: 16px;
        margin-bottom: 10px;
    }
    
    /* 调整学生卡片布局 */
    .el-col[v-for] {
        width: 100% !important;
    }

    /* 调整详情文字 */
    .detail {
        font-size: 14px;
        line-height: 2;
    }

    /* 标签样式调整 */
    .label {
        font-size: 10px;
        padding: 1px 3px;
    }
}
</style>
