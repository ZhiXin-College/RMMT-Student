<template>
    <div class="profile-card-container">
        <div @click="jump(student)" class="profile-card">
            <!-- 头像区域 -->
            <div class="avatar-section">
                <el-avatar class="avatar" :src="avatar(student)"></el-avatar>
                <span v-if="student.team_students_num !== undefined" :class="['team-flag', teamFlagColor(student.team_students_num)]">
                    <template v-if="student.team_students_num === 0">未组队</template>
                    <template v-else-if="student.team_students_num == 4">满员</template>
                    <template v-else>{{ student.team_students_num }}/4</template>
                </span>
            </div>
            
            <!-- 内容区域 -->
            <div class="content-section">
                <div class="text">
                    <div class="name" v-if="student.province !== null"> 
                        <div class="province">来自{{ student.province }}的</div> 
                        {{ student.name }} 
                        <label v-if="isNT(student.mbti)" class="mbti-label-NT">{{student.mbti}}</label>
                        <label v-if="isNF(student.mbti)" class="mbti-label-NF">{{student.mbti}}</label>
                        <label v-if="isSJ(student.mbti)" class="mbti-label-SJ">{{student.mbti}}</label>
                        <label v-if="isSP(student.mbti)" class="mbti-label-SP">{{student.mbti}}</label>
                    </div>
                    <div class="name" v-else> {{ student.name }} 
                        <label v-if="isNT(student.mbti)" class="mbti-label-NT">{{student.mbti}}</label>
                        <label v-if="isNF(student.mbti)" class="mbti-label-NF">{{student.mbti}}</label>
                        <label v-if="isSJ(student.mbti)" class="mbti-label-SJ">{{student.mbti}}</label>
                        <label v-if="isSP(student.mbti)" class="mbti-label-SP">{{student.mbti}}</label>
                    </div>
                    <span class="score">匹配指数： <strong>{{ student.score | numRounding }}</strong></span>
                    <div>
                        <span v-for="(trait, traitIndex) in getTraits(student.contact)" :key="traitIndex" class="label">{{trait}}</span>
                    </div>
                    <div class="contact">
                        <div><strong>QQ: </strong>{{ student.qq }}</div>
                        <div><strong>Wechat: </strong>{{student.wechat }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import md5 from "md5";

export default {
    name: "StudentCard",
    props: {
        student: {
            type: Object,
            required: true
        }
    },
    methods: {
        avatar(student) {
            if (student.qq && student.qq.length > 0) {
                return "https://q.qlogo.cn/headimg_dl?dst_uin=" + student.qq + "&spec=640";
            } else {
                const base_url = "https://gravatar.loli.net/avatar/";
                const email = new Date().getFullYear() + "rmmp." + student.id + "@chacuo.net";
                const hash = md5(email);
                return base_url + hash + "?d=retro";
            }
        },
        jump(student) {
            this.$router.push("/roommates/" + student.id);
        },
        getTraits(contact) {
            if (contact && contact.length < 15) {
                return contact.split(/[,，;；]/).map(trait => trait.trim());
            } else {
                return null;
            }
        },
        isNT(mbti) {
            return ['INTJ', 'INTP', 'ENTP', 'ENTJ'].includes(mbti);
        },
        isNF(mbti) {
            return ['INFJ', 'INFP', 'ENFP', 'ENFJ'].includes(mbti);
        },
        isSJ(mbti) {
            return ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'].includes(mbti);
        },
        isSP(mbti) {
            return ['ISTP', 'ISFP', 'ESTP', 'ESFP'].includes(mbti);
        },
        teamFlagColor(num) {
            if (num === 0) return 'flag-green';
            if (num === 4) return 'flag-red';
            return 'flag-orange';
        }
    },
    filters: {
        numRounding(num) {
            num = parseFloat(num);
            return isNaN(num) ? num : num.toFixed(2);
        }
    }
};
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Belanosima&family=Noto+Serif+SC&display=swap');
.profile-card-container {
    padding: 0px 20px;
    margin: 20px 0;
    container-type: inline-size; /* 启用容器查询 */

    .profile-card {
        border: #e6e6e6 solid 2px;
        border-radius: 12px;
        min-height: 170px;
        cursor: pointer;
        position: relative;
        
        /* 默认垂直布局（组件宽度 < 300px） */
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;

        .avatar-section {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
        }

        .content-section {
            flex: 1;
            width: 100%;
            display: flex;
            justify-content: center;
        }

        .avatar {
            width: 100px;
            height: 100px;
            display: block;
        }

        .team-flag {
            position: absolute;
            top: -10px;
            right: -10px;
            z-index: 20;
            padding: 2px 12px 2px 12px;
            border-radius: 0 10px 0 12px;
            font-size: 12px;
            font-weight: bold;
            color: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .flag-green {
            background: #4caf50;
        }
        .flag-red {
            background: #ff5252;
        }
        .flag-orange {
            background: #ff9800;
        }

        .text {
            line-height: 1.5;
            overflow: hidden;
            text-align: center;
            font-family: 'Belanosima', sans-serif;
            font-family: 'Noto Serif SC', serif;

            .name{
                font-size: 20px;
                font-weight: bold;

                .province{
                    font-size: 10px
                }
            }

            .score{
                font-size: 14px;
                color: #242424;
                font-family: 'Belanosima', sans-serif;
                font-family: 'Noto Serif SC', serif;
            }

            /* Styling the label */
            .mbti-label-NT {
                display: inline-block;
                background-color: #9b5cff;
                color: #ffffff;
                font-size: 12px;
                padding: 3px 3px;
                border-radius: 10px;
                vertical-align: middle;
                font-family: 'Courier New', Courier, monospace;
            }

            .mbti-label-NF{
                display: inline-block;
                background-color: #00642a;
                color: #fff;
                font-size: 12px;
                padding: 3px 3px;
                border-radius: 10px;
                vertical-align: middle;
                font-family: 'Courier New', Courier, monospace;
            }

            .mbti-label-SJ{
                display: inline-block;
                background-color: #007bff;
                color: #fff;
                font-size: 12px;
                padding: 3px 3px;
                border-radius: 10px;
                vertical-align: middle;
                font-family: 'Courier New', Courier, monospace;
            }

            .mbti-label-SP{
                display: inline-block;
                background-color: #a69d83;
                color: #fff;
                font-size: 12px;
                padding: 3px 3px;
                border-radius: 10px;
                vertical-align: middle;
                font-family: 'Courier New', Courier, monospace;
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
        }
    }

    .profile-card:hover {
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1)
    }

    .profile-card.no-score .text {
        top: 40px;
    }
}

/* 容器查询：当组件宽度 >= 300px 时，使用水平布局 */
@container (min-width: 300px) {
    .profile-card-container {
        .profile-card {
            /* 水平布局：头像在左，内容在右 */
            flex-direction: row;
            align-items: flex-start;
            padding: 20px;
            gap: 20px;

            .avatar-section {
                flex-shrink: 0;
                margin-bottom: 0;
                margin-right: 20px;
                display: flex;
                align-items: center;
            }

            .content-section {
                flex: 1;
                justify-content: flex-start;
                display: flex;
                align-items: center;
                margin-top: 20px;
                margin-left: -30px;
            }

            .text {
                text-align: left;
                margin: 0;
            }

            .avatar {
                width: 100px !important;
                height: 100px !important;
            }

            .team-flag {
                top: -5px;
                right: -5px;
            }
        }
    }
}

/* 容器查询：当组件宽度 >= 400px 时，进一步优化布局 */
@container (min-width: 400px) {
    .profile-card-container {
        .profile-card {
            .avatar {
                width: 135px;
                height: 135px;
            }

            .text {
                .name {
                    font-size: 18px;
                }

                .score {
                    font-size: 13px;
                }
            }
        }
    }
}

/* 容器查询：当组件宽度 >= 500px 时，使用更大的头像 */
@container (min-width: 500px) {
    .profile-card-container {
        .profile-card {
            .avatar {
                width: 150px;
                height: 150px;
            }

            .text {
                .name {
                    font-size: 20px;
                }

                .score {
                    font-size: 14px;
                }
            }
        }
    }
}

/* 移动端适配 - 使用传统媒体查询作为后备方案 */
@media (max-width: 768px) {
    .profile-card-container {
        padding: 0px 10px;
        margin: 10px 0;
        
        .profile-card {
            min-height: 150px;
            padding: 15px;
            
            .avatar {
                width: 80px;
                height: 80px;
            }
            
            .text {
                .name {
                    font-size: 16px;
                }
                
                .score {
                    font-size: 12px;
                }
                
                .contact {
                    font-size: 9px;
                }
                
                .label {
                    font-size: 7px;
                    padding: 1px 3px;
                }
            }
        }
    }
}

/* 小屏幕适配 */
@media (max-width: 480px) {
    .profile-card-container {
        padding: 0px 5px;
        
        .profile-card {
            min-height: 140px;
            padding: 10px;
            
            .avatar {
                width: 70px;
                height: 70px;
            }
            
            .text {
                .name {
                    font-size: 14px;
                }
                
                .score {
                    font-size: 11px;
                }
                
                .contact {
                    font-size: 8px;
                }
            }
        }
    }
}


</style>
