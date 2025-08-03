<template>
    <div class="requests">
        
        <el-row type="flex" justify="center">
            <el-col :span="21">
                <PageHeader title="组队请求 | Team Requests"></PageHeader>
            </el-col>
        </el-row>
        <el-row type="flex" justify="center">
            <el-col :span="20">
                <div class="default-container">
                    <el-row>
                        <el-col :span="24">
                            <div class="card-title">
                                组队邀请
                            </div>
                        </el-col>
                    </el-row>

                    <el-row>
                        <el-col v-if="team_invitations.length == 0" :span="24">
                            <el-empty description="你还没有发出或收到过组队邀请哦~"></el-empty>
                        </el-col>

                        <el-col v-else :span="24">
                            <el-table
                                :data="team_invitations"
                                stripe
                                style="width: 100%">
                                <el-table-column
                                    prop="id"
                                    label="#"
                                    width="120px">
                                </el-table-column>
                                <el-table-column
                                    label="发起人">
                                    <template #default="scope">
                                        <span v-if="scope.row.from_student.id === $auth.user.id"> 我 </span>
                                        <nuxt-link :to="'/roommates/' + scope.row.from_student.id" class="student-link"
                                                   v-else> {{ scope.row.from_student.name }}
                                        </nuxt-link>
                                    </template>
                                </el-table-column>

                                <el-table-column
                                    label="接收人">
                                    <template #default="scope">
                                        <span v-if="scope.row.to_student.id === $auth.user.id"> 我 </span>
                                        <nuxt-link :to="'/roommates/' + scope.row.to_student.id" class="student-link"
                                                   v-else> {{ scope.row.to_student.name }}
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
                                        <div class="action buttons" v-if="scope.row.status === 0">
                                            <div v-if="scope.row.from_student.id === $auth.user.id">
                                                <el-button size="mini" type="info"
                                                           @click="withdrawInvitation(scope.row)">撤回
                                                </el-button>
                                            </div>

                                            <div v-else>
                                                <el-button size="mini" @click="refuseInvitation(scope.row)"
                                                           type="danger">拒绝
                                                </el-button>
                                                <el-button size="mini" @click="acceptInvitation(scope.row)"
                                                           type="success">接受
                                                </el-button>
                                            </div>
                                        </div>
                                    </template>
                                </el-table-column>
                            </el-table>
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
                        <el-col v-if="team_requests.length == 0" :span="24">
                            <el-empty description="你还没有发出过入队申请哦~"></el-empty>
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
                                    label="目标队伍">
                                    <template #default="scope">
                                        <nuxt-link v-if="scope.row.team !== null"
                                                   :to="'/roommates/' + scope.row.team.students[0].id"
                                                   class="student-link">
                                            #{{ scope.row.team.id }} ({{ scope.row.team.students[0].name }} 等)
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
                                        <div class="action buttons" v-if="scope.row.status === 0">
                                            <el-button size="mini" @click="withdrawRequest(scope.row)" type="info">撤回
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
export default {
    name: "requests",
    data() {
        return {
            team_invitations: [],
            team_requests: []
        }
    },
    methods: {
        withdrawInvitation(invitation) {
            this.$confirm("你确定要撤回这个申请吗？").then(() => {
                this.$axios.$post("/team/invitation/process", {
                    team_invitation_id: invitation.id,
                    accept: false
                }).then(data => {
                    if (data.code === 200) {
                        this.$message.success("申请已撤回")
                        invitation.status = -2

                    }
                })
            })
        },
        withdrawRequest(request) {
            this.$confirm("你确定要撤回这个请求吗？").then(() => {
                this.$axios.$post("/team/request/process", {
                    team_request_id: request.id,
                    accept: false
                }).then(data => {
                    if (data.code === 200) {
                        this.$message.success("请求已撤回")
                        request.status = -2

                    }
                })
            })
        },
        acceptInvitation(invitation) {
            this.$confirm("你确定已经和这位同学充分沟通过，了解并能接受他所有的生活习惯吗？").then(() => {
                this.$axios.$post("/team/invitation/process", {
                    team_invitation_id: invitation.id,
                    accept: true
                }).then(data => {
                    if (data.code === 200) {
                        this.$message.success("申请已通过，组队成功！")
                        this.$auth.fetchUser().then(() => {
                            this.$router.push("/team/my")
                        })
                    }
                })
            })
        },
        refuseInvitation(invitation) {
            this.$confirm("你确定要拒绝这位同学的申请吗？").then(() => {
                this.$axios.$post("/team/invitation/process", {
                    team_invitation_id: invitation.id,
                    accept: false
                }).then(data => {
                    if (data.code === 200) {
                        this.$message.success("申请已拒绝")
                        invitation.status = -1
                    }
                })
            })
        }
    },
    async asyncData({$axios}) {
        // 组队申请 可能收到也可能发出
        let team_invitations = await $axios.$get("/team/invitations").then(data => {
            if (data.code === 200)
                return data.data.team_invitations
        })

        // 入队申请 只能发出
        let team_requests = await $axios.$get("/team/requests").then(data => {
            if (data.code === 200)
                return data.data.team_requests
        })

        return {
            team_invitations, team_requests
        }
    },
    created() {
        this.$auth.fetchUser().then(() => {
            if (this.$auth.user.team !== null){
                this.$router.push("/team/my")
            }
        })
    }
}
</script>

<style scoped>

</style>
