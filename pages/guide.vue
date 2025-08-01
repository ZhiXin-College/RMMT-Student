<template>
    <div class="guide">
        <el-row type="flex" justify="center">
            <el-col :span="21">
                <PageHeader title="向导 | Guide"></PageHeader>
            </el-col>
        </el-row>
        <el-row type="flex" justify="center">
             
            <el-col :span="20">
                <div class="default-container">
                    <el-steps :active="active_index()" align-center finish-status="success" :direction="stepsDirection">
                        <el-step title="系统预开放">
                            <template v-slot:description>
                                Some preparations of the system
                                <br/>
                                Now ~ {{ step_1_start_at }}
                            </template>
                        </el-step>
                        <el-step title="问卷调查">
                            <template v-slot:description>
                                Finishing a questionnaire about living habits
                                <br/>
                                {{ step_1_start_at }} ~ {{ step_1_end_at }}
                            </template>
                        </el-step>
                        <el-step title="算法匹配">
                            <template v-slot:description>
                                Finding the people who share the same habits as you by system
                                <br/>
                                {{ step_2_start_at }} ~ {{ step_2_end_at }}
                            </template>
                        </el-step>
                        <el-step title="自由组队">
                            <template v-slot:description>
                                Matching your roommates freely
                                <br/>
                                {{ step_3_start_at }} ~ {{ step_3_end_at }}
                            </template>
                        </el-step>
                        <el-step title="辅导员确定">
                            <template v-slot:description>
                                Getting your final roommates after admins' arranging
                            </template>
                        </el-step>
                    </el-steps>
                </div>
            </el-col>
        </el-row>

        <el-row type="flex" justify="center">
            <el-col :span="20">
                <div class="default-container">
                    <div class="sui-sui-nian">
                        <div class="title">
                            来自学长的一些碎碎念
                        </div>
                        <div class="content" v-html="$md.render(this.tips)">
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
export default {
    name: "guide",
    data() {
        return this.$store.state.system_settings
    },
    computed: {
        stepsDirection() {
            return window.innerWidth <= 600 ? 'vertical' : 'horizontal'
        }
    },
    methods: {
        active_index() {
            let current = Date.now();
            if (current < new Date(this.step_1_start_at))
                return 0
            else if (Date.parse(this.step_1_start_at) <= current && current <= Date.parse(this.step_1_end_at))
                return 1
            else if (Date.parse(this.step_2_start_at) <= current && current <= Date.parse(this.step_2_end_at))
                return 2
            else if (Date.parse(this.step_3_start_at) <= current && current <= Date.parse(this.step_3_end_at))
                return 3
            else
                return 4
        }
    },
    mounted() {
        window.addEventListener('resize', this.$forceUpdate)
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.$forceUpdate)
    },
    async fetch({store}) {
        if (store.state.system_settings.step_1_start_at === null)
            await store.dispatch("refresh_system_settings")
    }

}
</script>

<style lang="scss" scoped>
.sui-sui-nian {
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
    line-height: 1.7;
    font-size: 14px;

    .sub-title {
        font-size: 18px;
        margin-bottom: 5px;
    }

    .title {
        font-size: 20px;
        margin-bottom: 10px;
    }
}

.default-container {
    max-width: 100%;
}

@media (max-width: 600px) {
    .default-container {
        padding: 20px 2vw 20px 2vw;
    }
    .sui-sui-nian {
        font-size: 13px;
        .title {
            font-size: 16px;
        }
        .sub-title {
            font-size: 15px;
        }
    }
    .el-steps {
        padding: 0 0;
    }
    .el-step__title, .el-step__description {
        font-size: 13px !important;
        word-break: break-all;
    }
}
</style>
