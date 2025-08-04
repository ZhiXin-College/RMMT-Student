<template>
    <div class="questionnaire">
        
        <el-row type="flex" justify="center">
            <el-col :span="21">
                <PageHeader title="问卷调查 | Questionnaire"></PageHeader>
            </el-col>
        </el-row>
        <el-row type="flex" justify="center">
            <el-col :span="20">
                <div class="default-container ">
                    <v-form-render :form-json="formJson" :form-data="formData" ref="vFormRef">
                    </v-form-render>

                    <el-dialog title="权重设置" :visible.sync="showWeightPlane" :width="dialogWidth">
                        <div class="tips">
                            目前系统仅对必填问题进行算法匹配，因此只能设置问卷中部分问题的权重，其他没有权重（或权重为0）的问题代表仅作个人资料展示，不作算法匹配的参考项目 <br/>
                            请把你认为对你很重要的问题权重调高，不重要的问题权重调低或者设置为 0 喔 <br/>
                            <span style="color: red">最好不要把所有问题的权重都设置成为一样的哦！</span> <br />
                            你设置的权重只在计算你看到的分数时有效，不会影响你对别人的分数 <br />
                            计算匹配分数时采用的是相对权重，也就是每个问题的实际权重等于该问题的权重除以所有问题的总权重 <br />
                            所以如果某个问题的权重设置得过高，该问题很有可能成为判断相似度的唯一标准 <br />
                            如果所有问题的权重都设置成一样的，那么所有问题都差不多的<u>不</u>重要 <br />
                        </div>
                        <div style="overflow-x:auto;">
                        <el-table :data="questionWithWeight" stripe style="min-width: 400px;">
                            <el-table-column
                                prop="title"
                                label="问题">
                            </el-table-column>
                            <el-table-column
                                prop="default_weight"
                                :formatter="defaultWeightFormatter"
                                label="参考权重">
                            </el-table-column>
                            <el-table-column
                                prop="weight"
                                label="权重">

                                <template slot-scope="scope">

                                    <el-input-number
                                        v-model.number="scope.row.weight" :span="2" v-if="scope.row.default_weight >= 0" :min="0">
                                    </el-input-number>
                                </template>
                            </el-table-column>
                        </el-table>
                        </div>
                        <br/>
                        <el-button class="save-btn" type="primary" @click="save">Save</el-button>
                    </el-dialog>
                    <el-tooltip class="item" effect="dark" :disabled="canSave()"
                                content="The questionnaire cannot be changed now"
                                placement="right">
                        <div style="display: inline-block">
                            <el-button type="primary" :disabled="!canSave()" @click="preSave">Save</el-button>

                        </div>
                    </el-tooltip>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
export default {
    name: "questionnaire",
    data() {
        return {
            system_settings: this.$store.state.system_settings,
            formJson: this.$store.state.system_settings.questionnaire_json,
            formData: {},
            questionWithWeight: [],
            showWeightPlane: false,
            dialogWidth: window.innerWidth < 600 ? '95%' : '50%',
        }
    },
    mounted() {
        window.addEventListener('resize', this.updateDialogWidth)
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.updateDialogWidth)
    },
    methods: {
        updateDialogWidth() {
            this.dialogWidth = window.innerWidth < 600 ? '95%' : '50%'
        },
        preSave() {
            this.$refs.vFormRef.getFormData().then(formData => {
                this.showWeightPlane = true
            }).catch(error => {
                this.$message.error(error)
            })
        },
        save: _.throttle(async function () {
            if (!this.canSave())
                return

            this.$refs.vFormRef.getFormData().then(formData => {
                // 构造数据
                let data_to_store = {}
                _.forIn(formData, (value, key) => {
                    data_to_store[key] = {
                        weight: _.filter(this.questionWithWeight, {id: key})[0].weight,
                        answer: JSON.stringify(value),
                        item_id: key
                    }
                })
                this.$axios.$post("/questionnaire/answer", data_to_store).then(data => {
                    if (data.code === 200) {
                        this.showWeightPlane = false
                        this.$message.success("学生问卷数据已保存")
                    }
                }).catch(error => {
                    this.showWeightPlane = false
                    this.$message.error(error)
                })
            })
        }, 2000),
        canSave() {
            let current = new Date()
            if (new Date(this.system_settings.step_1_start_at) <= current && current <= new Date(this.system_settings.step_1_end_at))
                return true
            else
                return false
        },
        defaultWeightFormatter(row, column) {
            let num = parseFloat(row[column.property])
            if (num < 0){
                return "";
            }
            if (!isNaN(num)) {
                return ((num + '').indexOf('.') == -1) ? num : num.toFixed(2);
            }
        }
    },
    async asyncData({params, $axios, $store}) {
        function convert_data(str) {
            try {
                let obj = JSON.parse(str);
                return obj
            } catch (e) {
                return str
            }
        }

        let questionnaireItems = await $axios.$get('/questionnaire/list').then(data => {
            return data.data
        })

        let questionnaireAnswers = await $axios.$get('/questionnaire/answer').then(data => {
            return data.data
        })

        let questionWithWeight = []

        questionnaireItems.forEach(element => {
            let item_id = element.id
            // 先找找用户有没有回答过这个问题 有就用他设置的权重 没有就用默认权重
            let answer = _.filter(questionnaireAnswers, {item_id: item_id})
            let weight
            if (element.weight < 0) {
                weight = element.weight
            } else if (answer.length > 0)
                weight = answer[0].weight
            else
                weight = element.weight

            questionWithWeight.push({
                id: item_id,
                title: element.title,
                weight: weight,
                default_weight: element.weight,
            })
        })

        let formData = {}

        questionnaireAnswers.forEach(element => {
            formData[element.item_id] = convert_data(element.answer)
        })
        return {
            formData,
            questionWithWeight
        }
    },
    async fetch({store}) {
        if (store.state.system_settings.step_1_start_at === null)
            await store.dispatch("refresh_system_settings")
    }
}
</script>

<style scoped>

.tips {
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
    line-height: 2;
    font-size: 14px;
    color: rgba(0, 0, 0, .87);
    margin-bottom: 10px;
}

@media (max-width: 600px) {
  .default-container {
    padding: 8px !important;
  }
  .tips {
    font-size: 12px;
    line-height: 1.6;
  }
  .el-dialog {
    width: 95% !important;
    min-width: unset !important;
    margin: 0 auto;
  }
  .el-table {
    font-size: 12px;
  }
  .el-button, .save-btn {
    width: 100% !important;
    margin-bottom: 10px;
  }
  .el-input-number {
    width: 100% !important;
  }
}
</style>
