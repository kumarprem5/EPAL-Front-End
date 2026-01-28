import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SampleFilterRequest {
  page: number;
  size: number;
  fromDate: string;
  toDate: string;
}

export interface Sample {
  reportNumber: string;
  sampleDescription: string;
  createdAt: string;
  qualityChecked: boolean;
}

export interface ApiResponse {
  code: string;
  data: {
    content: Sample[];
    totalElements: number;
  };
  message: string;
  status: string;
}

