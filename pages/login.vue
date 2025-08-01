<template>
    <div class="login-box">
        <div class="login-card">
            <ZhixinLogo class="zhixin-logo"></ZhixinLogo>
            <div class="logo">
                RMMT Student
            </div>
            <el-form ref="login_form" :model="login_form" :rules="rules" label-position="top" class="login-form">
                <el-form-item label="账号 / Account" prop="id" class="form-item">
                    <el-input 
                        v-model.number="login_form.id" 
                        placeholder="请输入手机号"
                        size="large"
                        prefix-icon="el-icon-user"
                    ></el-input>
                </el-form-item>

                <el-form-item label="密码 / Password" prop="password" class="form-item">
                    <el-input 
                        type="password" 
                        v-model="login_form.password" 
                        placeholder="请输入密码"
                        size="large"
                        prefix-icon="el-icon-lock"
                        show-password
                    ></el-input>
                </el-form-item>

                <el-button 
                    type="primary" 
                    @click="login" 
                    size="large"
                    class="login-button"
                    :loading="loading"
                >
                    {{ loading ? '登录中...' : '登录 / Login' }}
                </el-button>
            </el-form>
        </div>
    </div>
</template>

<script>
export default {
    name: "login",
    auth: 'guest',
    layout: "auth",
    data() {
        return {
            login_form: {
                id: null,
                password: ""
            },
            loading: false,
            rules: {
                id: {
                    type: 'number',
                    required: true,
                    message: '请输入手机号',
                    trigger: 'blur'
                },
                password: {
                    type: 'string',
                    pattern: /^[^\s]*$/,
                    message: "密码不能包含空格，且至少8个字符",
                    required: true,
                    min: 8,
                    trigger: 'blur'
                }
            }
        }
    },
    methods: {
        login: _.throttle(async function () {
            this.$refs['login_form'].validate(async (valid) => {
                if (valid) {
                    this.loading = true
                    try {
                        let response = await this.$auth.login({
                            data: this.login_form
                        })

                        if (response.data.code === 200) {
                            this.$message.success("欢迎 " + this.$auth.user.name + "!")
                        }

                    } catch (e) {
                        console.error(e)
                        this.$message.error("登录失败，请检查学号和密码")
                    } finally {
                        this.loading = false
                    }

                    return true
                } else {
                    return false
                }
            })
        }, 3000)
    }
}

</script>

<style scoped>
.login-box {
    display: flex;
    align-content: center;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    background: #f5f6fa;
    background-image: url('/login-background.jpg'); 
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.login-card {
    width: 420px;
    max-width: 95vw;
    background: #ffffff;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 32px 40px 40px 40px;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.logo {
    margin-top: 20px;
    margin-bottom: 30px;
    text-align: center;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 2.2rem;
    font-weight: 600;
    color: #2c3e50;
    letter-spacing: 1px;
}

.zhixin-logo {
    text-align: center;
    margin-bottom: 10px;
}

.login-form {
    width: 100%;
    max-width: 100%;
}

.form-item {
    margin-bottom: 24px !important;
}

.form-item :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 500;
    color: #606266;
    margin-bottom: 8px;
    line-height: 1.4;
}

.form-item :deep(.el-input__inner) {
    height: 48px;
    line-height: 48px;
    border-radius: 8px;
    border: 2px solid #e4e7ed;
    transition: all 0.3s ease;
    font-size: 16px;
    padding-left: 45px;
}

.form-item :deep(.el-input__inner:focus) {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.form-item :deep(.el-input__prefix) {
    left: 15px;
    color: #909399;
}

.form-item :deep(.el-input__suffix) {
    right: 15px;
}

.login-button {
    width: 100%;
    height: 48px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, #409eff 0%, #36a3f7 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    transition: all 0.3s ease;
    margin-top: 10px;
}

.login-button:hover {
    background: linear-gradient(135deg, #36a3f7 0%, #2d8cf0 100%);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
    transform: translateY(-1px);
}

.login-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}


@media (max-width: 480px) {
    .login-card {
        width: 80vw;
        padding: 24px 24px 32px 24px;
    }
    
    .logo {
        font-size: 1.8rem;
        margin-bottom: 24px;
    }
    
    .form-item {
        margin-bottom: 20px !important;
    }
    
    .form-item :deep(.el-input__inner) {
        height: 44px;
        line-height: 44px;
        font-size: 15px;
    }
    
    .login-button {
        height: 44px;
        font-size: 15px;
    }
}

@media (max-width: 360px) {
    .login-card {
        width: 70vw;
        padding: 20px 16px 28px 16px;
    }
    
    .logo {
        font-size: 1.6rem;
        margin-bottom: 20px;
    }
}
</style>
