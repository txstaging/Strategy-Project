import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IAddGoalResponse } from '../interfaces/IAddGoalBody';
import { IDeleteGoalResponse } from '../interfaces/IDeleteGoalResponse';
import { IGetAllGoalsResponse } from '../interfaces/IGetAllGoals';
import { IGetGoalByIdResponse } from '../interfaces/IGetGoalById';
import { IUpdateAllGoalStatusResponse } from '../interfaces/IUpdateAllGoalStatusResponse';
import { IUpdateGoalResponse } from '../interfaces/IUpdateGoalBody';


@Injectable({
  providedIn: 'root',
})
export class GoalService {

  private readonly http = inject(HttpClient)



getAllGoals() {
  return this.http.get<IGetAllGoalsResponse>('/OurGoals')
}

getAllGoalsAdmin() {
  return this.http.get<IGetAllGoalsResponse>('/OurGoals/v2')
}

addGoal(goalData: FormData) {
  return this.http.post<IAddGoalResponse>('/OurGoals', goalData)
}

getGoalById(id: number) {
  return this.http.get<IGetGoalByIdResponse>(`/OurGoals/${id}`)
}

markAllGoalStatusFalse() {
  return this.http.post<IUpdateAllGoalStatusResponse>('/OurGoals/UpdateAllStatus', { Status: false })
}

updateGoal( goalData: FormData) {
  return this.http.post<IUpdateGoalResponse>(`/OurGoals`, goalData)
}

updateGoalStatus(goalId: number, status: boolean) {
  const FD = new FormData();
  FD.append('Id', goalId.toString());
  FD.append('Status', status.toString());
  return this.http.post<IUpdateGoalResponse>(`/OurGoals`, FD)
}

deleteGoal(id: number) {
  return this.http.delete<IDeleteGoalResponse>(`/OurGoals/${id}`)
}
}
