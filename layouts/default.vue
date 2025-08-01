<template>

    <div>
        <el-container>
            <el-header>
                <el-row class="header" text-align="middle" justify="space-between" type="flex">
                    <el-col class="site-name" :span="8">
                        <a href="/">Roommate Matcher</a>
                    </el-col>
                    <el-col class="site-name" :span="4"></el-col>

                    <!-- 桌面端菜单 -->
                    <el-col class="menu desktop-menu" :lg="10" :md="12" :xs="0" style="text-align: right;">
                        <el-menu ref="navigation_bar" mode="horizontal" :default-active="navUrl" :router="true">
                            <el-menu-item index="/guide">向导</el-menu-item>
                            <el-menu-item index="/questionnaire">问卷</el-menu-item>
                            <el-menu-item index="/roommates">舍友大厅</el-menu-item>
                            <el-menu-item v-if="$auth.user.team == null" index="/team/requests">组队请求</el-menu-item>
                            <el-menu-item v-else index="/team/my">我的组队</el-menu-item>
                            <el-submenu index="account">
                                <template slot="title">Hello，{{ this.$auth.user.name }}</template>
                                <el-menu-item @click="show_update_contact_panel = true">更新个人信息 Update Personal Info
                                </el-menu-item>
                                <el-menu-item @click="show_change_password_panel = true">修改密码 Change Password
                                </el-menu-item>
                                <el-menu-item @click="logout">退出登录 Logout</el-menu-item>
                            </el-submenu>
                        </el-menu>
                    </el-col>

                    <!-- 移动端汉堡按钮 -->
                    <el-col class="mobile-menu-btn" :xs="4" :sm="4" :md="0" :lg="0" style="text-align: right;">
                        <el-button icon="el-icon-menu" @click="drawerVisible = true" circle plain></el-button>
                    </el-col>
                </el-row>

                <!-- 移动端抽屉菜单 -->
                <el-drawer
                    title="菜单"
                    :visible.sync="drawerVisible"
                    direction="rtl"
                    size="70%"
                    class="mobile-menu-drawer"
                >
                    <el-menu
                        mode="vertical"
                        :default-active="navUrl"
                        :router="true"
                        @select="drawerVisible = false"
                    >
                        <el-menu-item index="/guide">向导</el-menu-item>
                        <el-menu-item index="/questionnaire">问卷</el-menu-item>
                        <el-menu-item index="/roommates">舍友大厅</el-menu-item>
                        <el-menu-item v-if="$auth.user.team == null" index="/team/requests">组队请求</el-menu-item>
                        <el-menu-item v-else index="/team/my">我的组队</el-menu-item>
                        <el-submenu index="account">
                            <template slot="title">Hello，{{ this.$auth.user.name }}</template>
                            <el-menu-item @click="show_update_contact_panel = true">更新个人信息 Update Personal Info
                            </el-menu-item>
                            <el-menu-item @click="show_change_password_panel = true">修改密码 Change Password
                            </el-menu-item>
                            <el-menu-item @click="logout">退出登录 Logout</el-menu-item>
                        </el-submenu>
                    </el-menu>
                </el-drawer>
            </el-header>

            <el-main>
                <Nuxt/>
            </el-main>

            <el-footer>
                <el-row>
                    <el-col class="copyright" :span="6">
                        Designed by Xuanyu Liu (2021) <br/>
                        Improved by Yicheng Xiao (2022) & Huitian Wang (2024)
                        Made With <span style="color: #e27575;font-size: 14px;">❤</span>
                    </el-col>
                    <el-col class="logo" :span="6" :offset="12">
                        <ZhixinLogo height="49.3px" width="98.25"></ZhixinLogo>
                    </el-col>
                </el-row>
            </el-footer>
        </el-container>

        <el-dialog :visible.sync="show_change_password_panel" title="修改密码" width="600px">
            <el-form ref="change_password_panel" :rules="rules" :model="change_password" label-width="100px">
                <el-form-item label="当前密码" prop="current_password">
                    <el-input type="password" v-model="change_password.current_password" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="新密码" prop="new_password">
                    <el-input type="password" v-model="change_password.new_password" autocomplete="off"
                              placeholder="新密码不能少于八位"></el-input>
                </el-form-item>
                <el-form-item label="确认密码" prop="confirm_password">
                    <el-input type="password" v-model="change_password.confirm_password" autocomplete="off"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="show_change_password_panel = false">取消</el-button>
                <el-button type="primary" @click="do_change_password">确认</el-button>
            </div>
        </el-dialog>

        <el-dialog title="更新个人信息| Update Personal Information" :visible.sync="show_update_contact_panel">
            <el-form>
                <el-form-item>
                    <el-input type="textarea" :autosize = "{minRows: 1, maxRows: 1}" placeholder="QQ" v-model="qq"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-input type="textarea" :autosize = "{minRows: 1, maxRows: 1}" placeholder="Wechat" v-model="wechat"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-input type="textarea" :autosize = "{minRows: 1, maxRows: 1}" placeholder="你来自哪里" v-model="province"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-input type="textarea" :autosize = "{minRows: 1, maxRows: 1}" placeholder="MBTI（可以到www.16personalities.com上自行测试）" v-model="mbti"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-input type="textarea" :autosize = "{minRows: 1, maxRows: 2}" placeholder="用三个2~4个字的词语描述一下自己吧(请用英文“;”来分割关键词)" v-model="contact"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="show_update_contact_panel = false">取 消</el-button>
                <el-button type="primary" @click="do_update_contact">确 定</el-button>
            </div>
        </el-dialog>
    </div>


</template>

<script>
import ZhixinLogo from "../components/ZhixinLogo";
export default {
    name: "default",
    components: {ZhixinLogo},
    data() {
        let confirm_password = (rule, value, callback) => {
            if (value === '') {
                callback(new Error('请再次输入密码'));
            } else if (value !== this.change_password.new_password) {
                callback(new Error('两次输入密码不一致!'));
            } else {
                callback();
            }
        };
        return {
            navUrl: null,
            show_change_password_panel: false,
            change_password: {
                current_password: null,
                new_password: null,
                confirm_password: null
            },
            rules: {
                current_password: [{
                    type: 'string',
                    pattern: /^[^\s]*$/,
                    message: "密码必须大于八位",
                    required: true,
                    min: 8,
                    trigger: 'blur'

                }],
                new_password: [{
                    type: 'string',
                    pattern: /^[^\s]*$/,
                    message: "新密码必须大于八位",
                    required: true,
                    min: 8,
                    trigger: 'blur'

                }],
                confirm_password: [
                    {validator: confirm_password, trigger: 'blur', required: true}
                ],
            },
            show_update_contact_panel: ((!this.$auth.user.qq || this.$auth.user.qq.length < 1) && (!this.$auth.user.wechat || this.$auth.user.wechat.length < 1)),
            contact: _.cloneDeep(this.$auth.user.contact),
            qq: _.cloneDeep(this.$auth.user.qq),
            wechat: _.cloneDeep(this.$auth.user.wechat),
            province: _.cloneDeep(this.$auth.user.province),
            mbti: _.cloneDeep(this.$auth.user.mbti),
            drawerVisible: false  // 添加这一行控制抽屉显示
        }
    },
    methods: {
        logout() {
            this.$auth.logout()
        },
        do_change_password() {
            this.$refs['change_password_panel'].validate(valid => {
                if (!valid) return;
                this.$axios.$post('/change_password', {
                    'current_password': this.change_password.current_password,
                    'new_password': this.change_password.new_password
                }).then(data => {
                    if (data.code === 200) {
                        this.show_change_password_panel = false
                        this.$refs['change_password_panel'].resetFields()
                        this.$message.success("修改密码成功！")
                    }
                })
            })
        },
        do_update_contact() {
            this.$axios.$post("/update_contact", {
                contact: this.contact,
                qq:this.qq,
                wechat:this.wechat,
                province:this.province,
                mbti:this.mbti
            }).then(data => {
                if (data.code === 200) {
                    this.$message.success("你的联系方式已更新")
                    this.show_update_contact_panel = false
                }
            })
        }
    },
    created() {
        this.navUrl = this.$route.path

        // 五分钟发送一次心跳包 刷新token
        setInterval(async () => {
            await this.$auth.fetchUser()
        }, 5 * 60 * 1000)
    }
}
</script>

<style scoped>
.header {
    height: 100%;
    border-bottom: solid 1px #e6e6e6;

}

.site-name {
    text-align: center;
    margin-top: 0.5rem;
}

a {
    font-family: Consolas, sans-serif;
    text-decoration: none;
    color: rgba(0, 0, 0, .87);
    font-size: 2rem;
}

.el-header {
    background: #ffffff;
}


.el-main {
    min-height: calc(100vh - 120px);
    background: linear-gradient(90deg, #fff2de 0%, #fdce8e 100%);
}

.el-footer{
    background: #ffffff;
}

.copyright{
    margin-top: 10px;
    font-size: 1.0rem;
}

/* 在你的 <style scoped> 里补充 */
@media (max-width: 600px) {
    .desktop-menu {
        display: none !important;
    }
    .mobile-menu-btn {
        display: block !important;
    }
    .site-name {
        text-align: left;
    }
    .site-name a {
        font-size: 1.5rem;
    }
}
@media (min-width: 601px) {
    .mobile-menu-btn {
        display: none !important;
    }
}
</style>
